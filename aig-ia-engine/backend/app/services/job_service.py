"""
Job Service for AIGestion IA Engine.

Manages background jobs for training and batch inference operations.
Provides job status tracking, progress updates, and result retrieval.
"""

import asyncio
import uuid
from collections import OrderedDict
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from app.services.metrics_service import metrics_service


class JobStatus(str, Enum):
    """Status of a background job."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class JobType(str, Enum):
    """Type of background job."""
    TRAINING = "training"
    BATCH_INFERENCE = "batch_inference"
    MODEL_EXPORT = "model_export"


@dataclass
class Job:
    """Represents a background job."""
    job_id: str
    job_type: JobType
    status: JobStatus
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    progress: float = 0.0  # 0.0 to 1.0
    message: str = ""
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert job to dictionary for API response."""
        return {
            "job_id": self.job_id,
            "job_type": self.job_type.value,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "progress": self.progress,
            "message": self.message,
            "result": self.result,
            "error": self.error,
            "metadata": self.metadata
        }


class JobService:
    """
    Service for managing background jobs.

    Features:
    - Job creation and tracking
    - Progress updates
    - Result storage
    - Job history (limited to last N jobs)
    """

    MAX_JOBS_HISTORY = 100  # Keep last 100 jobs

    def __init__(self):
        self._jobs: OrderedDict[str, Job] = OrderedDict()
        self._lock = asyncio.Lock()

    def create_job(
        self,
        job_type: JobType,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Job:
        """Create a new job and return it."""
        job_id = str(uuid.uuid4())

        job = Job(
            job_id=job_id,
            job_type=job_type,
            status=JobStatus.PENDING,
            created_at=datetime.utcnow(),
            metadata=metadata or {}
        )

        # Add to jobs dict
        self._jobs[job_id] = job

        # Trim old jobs if necessary
        self._trim_history()

        # Update metrics
        if job_type == JobType.TRAINING:
            metrics_service.training_jobs_total.labels(status="started").inc()

        return job

    def get_job(self, job_id: str) -> Optional[Job]:
        """Get a job by its ID."""
        return self._jobs.get(job_id)

    def get_all_jobs(
        self,
        job_type: Optional[JobType] = None,
        status: Optional[JobStatus] = None,
        limit: int = 50
    ) -> list:
        """Get all jobs, optionally filtered by type and status."""
        jobs = list(self._jobs.values())

        if job_type:
            jobs = [j for j in jobs if j.job_type == job_type]

        if status:
            jobs = [j for j in jobs if j.status == status]

        # Return most recent first
        jobs = sorted(jobs, key=lambda j: j.created_at, reverse=True)

        return jobs[:limit]

    def start_job(self, job_id: str) -> bool:
        """Mark a job as started."""
        job = self.get_job(job_id)
        if not job:
            return False

        job.status = JobStatus.RUNNING
        job.started_at = datetime.utcnow()
        job.message = "Job started"

        # Update metrics
        if job.job_type == JobType.TRAINING:
            metrics_service.training_jobs_active.inc()

        return True

    def update_progress(
        self,
        job_id: str,
        progress: float,
        message: str = ""
    ) -> bool:
        """Update job progress."""
        job = self.get_job(job_id)
        if not job:
            return False

        job.progress = min(max(progress, 0.0), 1.0)
        if message:
            job.message = message

        return True

    def complete_job(
        self,
        job_id: str,
        result: Optional[Dict[str, Any]] = None,
        message: str = "Job completed successfully"
    ) -> bool:
        """Mark a job as completed."""
        job = self.get_job(job_id)
        if not job:
            return False

        job.status = JobStatus.COMPLETED
        job.completed_at = datetime.utcnow()
        job.progress = 1.0
        job.message = message
        job.result = result

        # Update metrics
        if job.job_type == JobType.TRAINING:
            metrics_service.training_jobs_active.dec()
            metrics_service.training_jobs_total.labels(status="completed").inc()

        return True

    def fail_job(
        self,
        job_id: str,
        error: str,
        message: str = "Job failed"
    ) -> bool:
        """Mark a job as failed."""
        job = self.get_job(job_id)
        if not job:
            return False

        job.status = JobStatus.FAILED
        job.completed_at = datetime.utcnow()
        job.message = message
        job.error = error

        # Update metrics
        if job.job_type == JobType.TRAINING:
            metrics_service.training_jobs_active.dec()
            metrics_service.training_jobs_total.labels(status="failed").inc()

        return True

    def cancel_job(self, job_id: str) -> bool:
        """Cancel a pending or running job."""
        job = self.get_job(job_id)
        if not job:
            return False

        if job.status in [JobStatus.COMPLETED, JobStatus.FAILED]:
            return False  # Can't cancel finished jobs

        job.status = JobStatus.CANCELLED
        job.completed_at = datetime.utcnow()
        job.message = "Job cancelled by user"

        # Update metrics
        if job.job_type == JobType.TRAINING and job.status == JobStatus.RUNNING:
            metrics_service.training_jobs_active.dec()

        return True

    def _trim_history(self):
        """Remove old jobs if we exceed the history limit."""
        while len(self._jobs) > self.MAX_JOBS_HISTORY:
            # Remove oldest job
            self._jobs.popitem(last=False)


# Global job service instance
job_service = JobService()
