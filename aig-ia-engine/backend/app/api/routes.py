"""
API Routes for AIGestion IA Engine.

Defines all REST API endpoints for inference, training, and job management.
"""

from typing import Optional

from app.config import get_settings
from app.models.schemas import (
    FileInferenceResponse,
    HealthResponse,
    InferenceRequest,
    InferenceResponse,
    FeedbackRequest,
    FeedbackResponse,
    JobCancelResponse,
    JobListResponse,
    JobResponse,
    ModelsListResponse,
    TrainingRequest,
    TrainingResponse,
)
from app.services.file_inference_service import file_inference_service
from app.services.inference_service import inference_service
from app.services.job_service import JobStatus, JobType, job_service
from app.services.training_service import training_service
from fastapi import APIRouter, File, HTTPException, Query, UploadFile
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
settings = get_settings()


# ============================================
# HEALTH CHECK
# ============================================


@router.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint.

    Returns the current health status of the API.
    """
    return {
        "status": "ok",
        "app_name": settings.APP_NAME,
        "env": settings.APP_ENV,
        "version": "0.1.0",
    }


# ============================================
# INFERENCE ENDPOINTS
# ============================================


@router.post("/infer", response_model=InferenceResponse, tags=["Inference"])
async def infer(request: InferenceRequest):
    """
    Run inference on a single input.

    Accepts a list of input features and returns the prediction
    with confidence score.
    """
    try:
        result = inference_service.predict(request.input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/infer/file", response_model=FileInferenceResponse, tags=["Inference"])
async def infer_from_file(
    file: UploadFile = File(..., description="CSV or JSON file with input data"),
    async_processing: bool = Query(False, description="Force async processing (returns job_id)"),
):
    """
    Run batch inference from an uploaded file.

    Supported formats:
    - **CSV**: Each row is a sample, columns are features
    - **JSON**: Array of objects with "input_data" field, or array of arrays
    - **JSONL**: One JSON object per line

    For small files (< 100 samples), processing is synchronous.
    For larger files, a background job is created and job_id is returned.

    Use `async_processing=true` to force background processing.
    """
    try:
        # Read file content
        content = await file.read()

        # Process the file
        result = await file_inference_service.process_file(
            file_content=content,
            filename=file.filename or "unknown",
            async_processing=async_processing,
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/feedback", response_model=FeedbackResponse, tags=["Feedback"])
async def submit_feedback(feedback: FeedbackRequest):
    """
    Submit user feedback for a model prediction.

    Captures user corrections and ratings to improve future models.
    """
    try:
        # Log feedback as structured data for future analysis
        logger.info(
            "model_feedback_received",
            model_version=feedback.model_version,
            prediction_id=feedback.prediction_id,
            predicted=feedback.predicted_class,
            actual=feedback.actual_class,
            rating=feedback.rating,
            comments=feedback.comments,
            input_vector=feedback.input_data,
        )

        # In a real system, we might also push this to a 'feedback' queue in Redis
        # or write directly to a feedback table.
        # For now, structured logs + eventual consistency is a solid pattern.

        return {
            "success": True,
            "message": "Feedback received and recorded successfully.",
        }
    except Exception as e:
        logger.error(f"Error recording feedback: {e}")
        raise HTTPException(status_code=500, detail="Failed to record feedback")


# ============================================
# TRAINING ENDPOINTS
# ============================================


@router.post("/retrain", response_model=TrainingResponse, tags=["Training"])
async def start_training(request: TrainingRequest):
    """
    Start a model retraining job.

    Creates a background job that trains a new model using the specified
    dataset. Training progress can be monitored via the `/jobs/{job_id}` endpoint.

    **Parameters:**
    - `dataset_path`: Path to training data (CSV or JSON)
    - `epochs`: Number of training epochs (default: 10)
    - `batch_size`: Batch size (default: 32)
    - `learning_rate`: Learning rate (default: 0.001)
    - `model_name`: Optional name for the trained model
    """
    try:
        job_id = await training_service.start_training(
            dataset_path=request.dataset_path,
            epochs=request.epochs,
            batch_size=request.batch_size,
            learning_rate=request.learning_rate,
            model_name=request.model_name,
        )

        return {
            "job_id": job_id,
            "status": "pending",
            "message": f"Training job created. Will train for {request.epochs} epochs.",
            "status_url": f"/jobs/{job_id}",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# JOB MANAGEMENT ENDPOINTS
# ============================================


@router.get("/jobs", response_model=JobListResponse, tags=["Jobs"])
async def list_jobs(
    job_type: Optional[str] = Query(
        None, description="Filter by job type (training, batch_inference)"
    ),
    status: Optional[str] = Query(
        None, description="Filter by status (pending, running, completed, failed, cancelled)"
    ),
    limit: int = Query(50, ge=1, le=100, description="Maximum jobs to return"),
):
    """
    List all jobs with optional filtering.

    Returns jobs sorted by creation time (newest first).
    """
    # Convert string filters to enums
    type_filter = None
    status_filter = None

    if job_type:
        try:
            type_filter = JobType(job_type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid job_type: {job_type}")

    if status:
        try:
            status_filter = JobStatus(status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    jobs = job_service.get_all_jobs(job_type=type_filter, status=status_filter, limit=limit)

    return {"jobs": [job.to_dict() for job in jobs], "total": len(jobs)}


@router.get("/jobs/{job_id}", response_model=JobResponse, tags=["Jobs"])
async def get_job_status(job_id: str):
    """
    Get the status of a specific job.

    Returns detailed information about the job including:
    - Current status and progress
    - Timestamps (created, started, completed)
    - Result data (if completed)
    - Error message (if failed)
    """
    job = job_service.get_job(job_id)

    if not job:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")

    return job.to_dict()


@router.post("/jobs/{job_id}/cancel", response_model=JobCancelResponse, tags=["Jobs"])
async def cancel_job(job_id: str):
    """
    Cancel a pending or running job.

    Only jobs that are pending or running can be cancelled.
    Completed or failed jobs cannot be cancelled.
    """
    job = job_service.get_job(job_id)

    if not job:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")

    if job.status in [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED]:
        return {
            "job_id": job_id,
            "success": False,
            "message": f"Cannot cancel job with status: {job.status.value}",
        }

    # Try to cancel the job
    success = job_service.cancel_job(job_id)

    # Also cancel training if it's a training job
    if job.job_type == JobType.TRAINING:
        training_service.cancel_training(job_id)

    return {
        "job_id": job_id,
        "success": success,
        "message": "Job cancelled successfully" if success else "Failed to cancel job",
    }


# ============================================
# MODEL MANAGEMENT ENDPOINTS
# ============================================


@router.get("/models", response_model=ModelsListResponse, tags=["Models"])
async def list_models():
    """
    List available models.

    Returns the currently active model and all available models.
    """
    return {
        "active_model": settings.DEFAULT_MODEL,
        "available_models": ["hope-lite-v1", "hope-pro-v1"],
    }
