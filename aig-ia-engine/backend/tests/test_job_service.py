"""
Unit tests for the Job Service.

Tests job creation, status updates, and lifecycle management.
"""

from datetime import datetime

from app.services.job_service import Job, JobService, JobStatus, JobType, job_service


class TestJobService:
    """Tests for JobService class."""

    def setup_method(self):
        """Create a fresh job service for each test."""
        self.service = JobService()

    # ============================================
    # JOB CREATION TESTS
    # ============================================

    def test_create_job_returns_job_object(self):
        """Test that create_job returns a Job object."""
        job = self.service.create_job(JobType.TRAINING)

        assert isinstance(job, Job)
        assert job.job_id is not None
        assert len(job.job_id) == 36  # UUID format

    def test_create_job_sets_initial_status(self):
        """Test that new jobs have PENDING status."""
        job = self.service.create_job(JobType.TRAINING)

        assert job.status == JobStatus.PENDING
        assert job.progress == 0.0

    def test_create_job_sets_created_at(self):
        """Test that create_job sets created_at timestamp."""
        job = self.service.create_job(JobType.TRAINING)

        assert job.created_at is not None
        assert isinstance(job.created_at, datetime)

    def test_create_job_with_metadata(self):
        """Test creating a job with metadata."""
        metadata = {"dataset_path": "/path/to/data", "epochs": 10}
        job = self.service.create_job(JobType.TRAINING, metadata=metadata)

        assert job.metadata == metadata

    def test_create_job_different_types(self):
        """Test creating jobs of different types."""
        training_job = self.service.create_job(JobType.TRAINING)
        inference_job = self.service.create_job(JobType.BATCH_INFERENCE)

        assert training_job.job_type == JobType.TRAINING
        assert inference_job.job_type == JobType.BATCH_INFERENCE

    # ============================================
    # JOB RETRIEVAL TESTS
    # ============================================

    def test_get_job_returns_existing_job(self):
        """Test getting an existing job by ID."""
        created_job = self.service.create_job(JobType.TRAINING)
        retrieved_job = self.service.get_job(created_job.job_id)

        assert retrieved_job is not None
        assert retrieved_job.job_id == created_job.job_id

    def test_get_job_returns_none_for_nonexistent(self):
        """Test that get_job returns None for non-existent ID."""
        result = self.service.get_job("nonexistent-job-id")

        assert result is None

    def test_get_all_jobs_returns_list(self):
        """Test getting all jobs."""
        self.service.create_job(JobType.TRAINING)
        self.service.create_job(JobType.BATCH_INFERENCE)

        jobs = self.service.get_all_jobs()

        assert isinstance(jobs, list)
        assert len(jobs) == 2

    def test_get_all_jobs_filter_by_type(self):
        """Test filtering jobs by type."""
        self.service.create_job(JobType.TRAINING)
        self.service.create_job(JobType.TRAINING)
        self.service.create_job(JobType.BATCH_INFERENCE)

        training_jobs = self.service.get_all_jobs(job_type=JobType.TRAINING)

        assert len(training_jobs) == 2
        assert all(j.job_type == JobType.TRAINING for j in training_jobs)

    def test_get_all_jobs_filter_by_status(self):
        """Test filtering jobs by status."""
        job1 = self.service.create_job(JobType.TRAINING)
        job2 = self.service.create_job(JobType.TRAINING)
        self.service.start_job(job1.job_id)

        running_jobs = self.service.get_all_jobs(status=JobStatus.RUNNING)
        pending_jobs = self.service.get_all_jobs(status=JobStatus.PENDING)

        assert len(running_jobs) == 1
        assert len(pending_jobs) == 1

    def test_get_all_jobs_respects_limit(self):
        """Test that get_all_jobs respects limit parameter."""
        for _ in range(10):
            self.service.create_job(JobType.TRAINING)

        jobs = self.service.get_all_jobs(limit=5)

        assert len(jobs) == 5

    # ============================================
    # JOB LIFECYCLE TESTS
    # ============================================

    def test_start_job_updates_status(self):
        """Test that start_job updates status to RUNNING."""
        job = self.service.create_job(JobType.TRAINING)
        result = self.service.start_job(job.job_id)

        assert result is True
        assert job.status == JobStatus.RUNNING
        assert job.started_at is not None

    def test_start_job_returns_false_for_nonexistent(self):
        """Test that start_job returns False for non-existent job."""
        result = self.service.start_job("nonexistent-job-id")

        assert result is False

    def test_update_progress(self):
        """Test updating job progress."""
        job = self.service.create_job(JobType.TRAINING)
        self.service.start_job(job.job_id)

        result = self.service.update_progress(job.job_id, 0.5, "Halfway done")

        assert result is True
        assert job.progress == 0.5
        assert job.message == "Halfway done"

    def test_update_progress_clamps_values(self):
        """Test that progress is clamped between 0 and 1."""
        job = self.service.create_job(JobType.TRAINING)

        self.service.update_progress(job.job_id, -0.5, "")
        assert job.progress == 0.0

        self.service.update_progress(job.job_id, 1.5, "")
        assert job.progress == 1.0

    def test_complete_job(self):
        """Test completing a job with result."""
        job = self.service.create_job(JobType.TRAINING)
        self.service.start_job(job.job_id)

        result_data = {"final_loss": 0.1, "epochs": 10}
        result = self.service.complete_job(
            job.job_id,
            result=result_data,
            message="Training complete"
        )

        assert result is True
        assert job.status == JobStatus.COMPLETED
        assert job.progress == 1.0
        assert job.result == result_data
        assert job.completed_at is not None

    def test_fail_job(self):
        """Test failing a job with error."""
        job = self.service.create_job(JobType.TRAINING)
        self.service.start_job(job.job_id)

        result = self.service.fail_job(
            job.job_id,
            error="OutOfMemoryError",
            message="Training failed"
        )

        assert result is True
        assert job.status == JobStatus.FAILED
        assert job.error == "OutOfMemoryError"
        assert job.completed_at is not None

    def test_cancel_job_pending(self):
        """Test cancelling a pending job."""
        job = self.service.create_job(JobType.TRAINING)
        result = self.service.cancel_job(job.job_id)

        assert result is True
        assert job.status == JobStatus.CANCELLED

    def test_cancel_job_running(self):
        """Test cancelling a running job."""
        job = self.service.create_job(JobType.TRAINING)
        self.service.start_job(job.job_id)
        result = self.service.cancel_job(job.job_id)

        assert result is True
        assert job.status == JobStatus.CANCELLED

    def test_cancel_job_already_completed(self):
        """Test that completed jobs cannot be cancelled."""
        job = self.service.create_job(JobType.TRAINING)
        self.service.start_job(job.job_id)
        self.service.complete_job(job.job_id)

        result = self.service.cancel_job(job.job_id)

        assert result is False
        assert job.status == JobStatus.COMPLETED

    # ============================================
    # JOB TO_DICT TESTS
    # ============================================

    def test_job_to_dict(self):
        """Test Job.to_dict() method."""
        job = self.service.create_job(
            JobType.TRAINING,
            metadata={"epochs": 10}
        )

        job_dict = job.to_dict()

        assert "job_id" in job_dict
        assert "job_type" in job_dict
        assert "status" in job_dict
        assert "created_at" in job_dict
        assert "progress" in job_dict
        assert "metadata" in job_dict
        assert job_dict["job_type"] == "training"
        assert job_dict["status"] == "pending"

    # ============================================
    # HISTORY MANAGEMENT TESTS
    # ============================================

    def test_trim_history_removes_old_jobs(self):
        """Test that history trimming removes oldest jobs."""
        # Temporarily reduce max history
        original_max = self.service.MAX_JOBS_HISTORY
        self.service.MAX_JOBS_HISTORY = 5

        try:
            # Create more jobs than max
            for i in range(10):
                self.service.create_job(JobType.TRAINING)

            # Should only keep last 5
            assert len(self.service._jobs) == 5
        finally:
            self.service.MAX_JOBS_HISTORY = original_max


class TestGlobalJobService:
    """Tests for the global job_service instance."""

    def test_global_instance_exists(self):
        """Test that global job_service exists."""
        assert job_service is not None
        assert isinstance(job_service, JobService)
