"""
Pydantic Schemas for AIGestion IA Engine API.

Defines all request and response models for the API endpoints.
"""

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

# ============================================
# ENUMS
# ============================================


class JobStatusEnum(str, Enum):
    """Status of a background job."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class JobTypeEnum(str, Enum):
    """Type of background job."""

    TRAINING = "training"
    BATCH_INFERENCE = "batch_inference"
    MODEL_EXPORT = "model_export"


# ============================================
# INFERENCE SCHEMAS
# ============================================


class InferenceRequest(BaseModel):
    """Request model for single inference."""

    input_data: List[float] = Field(
        ..., description="List of input features for the model", min_length=1
    )
    model_name: Optional[str] = Field(
        "hope-lite-v1", description="Name of the model to use for inference"
    )


class InferenceResponse(BaseModel):
    """Response model for single inference."""

    prediction: int = Field(..., description="Predicted class index")
    confidence: float = Field(..., description="Confidence score (0-1)")
    model_version: str = Field(..., description="Version of the model used")


class BatchInferenceResult(BaseModel):
    """Single result in batch inference."""

    index: int = Field(..., description="Index of the sample in the batch")
    prediction: int = Field(..., description="Predicted class index")
    confidence: float = Field(..., description="Confidence score (0-1)")


class BatchInferenceError(BaseModel):
    """Error in batch inference."""

    index: int = Field(..., description="Index of the failed sample")
    error: str = Field(..., description="Error message")


class FileInferenceResponse(BaseModel):
    """Response for synchronous file inference."""

    success: bool = Field(..., description="Whether processing was successful")
    processing_mode: str = Field(..., description="sync or async")
    filename: Optional[str] = Field(None, description="Original filename")
    total_samples: Optional[int] = Field(None, description="Total number of samples")
    successful: Optional[int] = Field(None, description="Number of successful predictions")
    failed: Optional[int] = Field(None, description="Number of failed predictions")
    duration_seconds: Optional[float] = Field(None, description="Processing time in seconds")
    results: Optional[List[BatchInferenceResult]] = Field(None, description="Inference results")
    errors: Optional[List[BatchInferenceError]] = Field(None, description="Errors if any")
    model_version: Optional[str] = Field(None, description="Model version used")
    # For async processing
    job_id: Optional[str] = Field(None, description="Job ID for async processing")
    message: Optional[str] = Field(None, description="Status message")
    status_url: Optional[str] = Field(None, description="URL to check job status")
    error: Optional[str] = Field(None, description="Error message if failed")


# ============================================
# FEEDBACK SCHEMAS
# ============================================


class FeedbackRequest(BaseModel):
    """User feedback for a model prediction."""

    model_version: str = Field(..., description="Model version used")
    prediction_id: Optional[str] = Field(
        None, description="ID of the prediction if available"
    )
    input_data: Optional[List[float]] = Field(
        None, description="Input data of the prediction"
    )
    predicted_class: int = Field(..., description="The class predicted by the model")
    actual_class: int = Field(..., description="The correct class (user correction)")
    rating: int = Field(
        ..., ge=1, le=5, description="1-5 star rating of the prediction"
    )
    comments: Optional[str] = Field(None, description="Optional user comments")


class FeedbackResponse(BaseModel):
    """Response for feedback submission."""

    success: bool = Field(..., description="Whether feedback was recorded")
    message: str = Field(..., description="Status message")


# ============================================
# TRAINING SCHEMAS
# ============================================


class TrainingRequest(BaseModel):
    """Request model for starting a training job."""

    dataset_path: str = Field(..., description="Path to the training dataset")
    epochs: int = Field(10, ge=1, le=1000, description="Number of training epochs")
    batch_size: int = Field(32, ge=1, le=512, description="Batch size for training")
    learning_rate: float = Field(0.001, gt=0, le=1, description="Learning rate for optimizer")
    model_name: Optional[str] = Field(None, description="Optional name for the trained model")


class TrainingResponse(BaseModel):
    """Response model for training job creation."""

    job_id: str = Field(..., description="Unique job identifier")
    status: str = Field(..., description="Initial job status")
    message: str = Field(..., description="Status message")
    status_url: str = Field(..., description="URL to check job status")


# ============================================
# JOB SCHEMAS
# ============================================


class JobResponse(BaseModel):
    """Response model for job status."""

    job_id: str = Field(..., description="Unique job identifier")
    job_type: str = Field(..., description="Type of job (training, batch_inference)")
    status: str = Field(..., description="Current job status")
    created_at: str = Field(..., description="Job creation timestamp (ISO format)")
    started_at: Optional[str] = Field(None, description="Job start timestamp")
    completed_at: Optional[str] = Field(None, description="Job completion timestamp")
    progress: float = Field(..., ge=0, le=1, description="Job progress (0-1)")
    message: str = Field(..., description="Current status message")
    result: Optional[Dict[str, Any]] = Field(None, description="Job result if completed")
    error: Optional[str] = Field(None, description="Error message if failed")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional job metadata")


class JobListResponse(BaseModel):
    """Response model for listing jobs."""

    jobs: List[JobResponse] = Field(..., description="List of jobs")
    total: int = Field(..., description="Total number of jobs returned")


class JobCancelResponse(BaseModel):
    """Response model for job cancellation."""

    job_id: str = Field(..., description="Job ID")
    success: bool = Field(..., description="Whether cancellation was successful")
    message: str = Field(..., description="Result message")


# ============================================
# MODEL SCHEMAS
# ============================================


class ModelInfo(BaseModel):
    """Information about a model."""

    name: str = Field(..., description="Model name/identifier")
    version: str = Field(..., description="Model version")
    description: Optional[str] = Field(None, description="Model description")
    input_dim: int = Field(..., description="Input dimension")
    output_dim: int = Field(..., description="Output dimension (number of classes)")
    device: str = Field(..., description="Device the model is loaded on")


class ModelsListResponse(BaseModel):
    """Response for listing available models."""

    active_model: str = Field(..., description="Currently active model")
    available_models: List[str] = Field(..., description="List of available model names")


# ============================================
# HEALTH CHECK SCHEMAS
# ============================================


class HealthResponse(BaseModel):
    """Response for health check endpoint."""

    status: str = Field(..., description="Health status (ok, degraded, unhealthy)")
    app_name: str = Field(..., description="Application name")
    env: str = Field(..., description="Environment (development, production)")
    version: Optional[str] = Field(None, description="Application version")
    uptime_seconds: Optional[float] = Field(None, description="Uptime in seconds")
