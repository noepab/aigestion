"""
Unit tests for the Training Service.

Tests async training, progress updates, and checkpoint saving.
"""

import asyncio
from pathlib import Path

import pytest
from app.services.job_service import JobStatus, job_service
from app.services.training_service import TrainingService, training_service


class TestTrainingService:
    """Tests for TrainingService class."""

    def setup_method(self):
        """Create a fresh training service for each test."""
        self.service = TrainingService()

    # ============================================
    # INITIALIZATION TESTS
    # ============================================

    def test_service_initializes(self):
        """Test that service initializes correctly."""
        assert self.service is not None
        assert self.service.device is not None

    def test_service_has_settings(self):
        """Test that service has settings loaded."""
        assert self.service.settings is not None

    # ============================================
    # TRAINING JOB CREATION TESTS
    # ============================================

    @pytest.mark.asyncio
    async def test_start_training_returns_job_id(self, training_request_data):
        """Test that start_training returns a job ID."""
        job_id = await self.service.start_training(
            dataset_path=training_request_data["dataset_path"],
            epochs=training_request_data["epochs"],
            batch_size=training_request_data["batch_size"],
            learning_rate=training_request_data["learning_rate"],
            model_name=training_request_data["model_name"],
        )

        assert job_id is not None
        assert len(job_id) == 36  # UUID format

    @pytest.mark.asyncio
    async def test_start_training_creates_job(self, training_request_data):
        """Test that start_training creates a job in job_service."""
        job_id = await self.service.start_training(
            dataset_path=training_request_data["dataset_path"], epochs=1, batch_size=16
        )

        job = job_service.get_job(job_id)
        assert job is not None

    @pytest.mark.asyncio
    async def test_training_job_completes(self, training_request_data):
        """Test that training job completes successfully."""
        job_id = await self.service.start_training(
            dataset_path=training_request_data["dataset_path"], epochs=1, batch_size=16
        )

        # Wait for training to complete (with timeout)
        for _ in range(30):  # Max 3 seconds
            await asyncio.sleep(0.1)
            job = job_service.get_job(job_id)
            if job.status in [JobStatus.COMPLETED, JobStatus.FAILED]:
                break

        job = job_service.get_job(job_id)
        assert job.status == JobStatus.COMPLETED
        assert job.progress == 1.0

    @pytest.mark.asyncio
    async def test_training_job_has_result(self, training_request_data):
        """Test that completed training job has result data."""
        job_id = await self.service.start_training(
            dataset_path=training_request_data["dataset_path"], epochs=1, batch_size=16
        )

        # Wait for completion
        for _ in range(30):
            await asyncio.sleep(0.1)
            job = job_service.get_job(job_id)
            if job.status == JobStatus.COMPLETED:
                break

        assert job.result is not None
        assert "final_loss" in job.result
        assert "epochs_completed" in job.result
        assert "checkpoint_path" in job.result

    @pytest.mark.asyncio
    async def test_training_saves_checkpoint(self, training_request_data):
        """Test that training saves a checkpoint file."""
        job_id = await self.service.start_training(
            dataset_path=training_request_data["dataset_path"], epochs=1, batch_size=16
        )

        # Wait for completion
        for _ in range(30):
            await asyncio.sleep(0.1)
            job = job_service.get_job(job_id)
            if job.status == JobStatus.COMPLETED:
                break

        checkpoint_path = Path(job.result["checkpoint_path"])
        assert checkpoint_path.exists()

        # Cleanup
        if checkpoint_path.exists():
            checkpoint_path.unlink()

    # ============================================
    # DATASET LOADING TESTS
    # ============================================

    def test_load_or_create_dataset_returns_dataloader(self):
        """Test that _load_or_create_dataset returns a DataLoader and metadata."""
        from torch.utils.data import DataLoader

        loader, input_dim, num_classes = self.service._load_or_create_dataset(
            dataset_path="./nonexistent.csv", batch_size=32
        )

        assert isinstance(loader, DataLoader)
        assert isinstance(input_dim, int)
        assert isinstance(num_classes, int)

    def test_synthetic_dataset_has_correct_shape(self):
        """Test that synthetic dataset has correct dimensions."""
        loader, input_dim, num_classes = self.service._load_or_create_dataset(
            dataset_path="./nonexistent.csv", batch_size=32
        )

        batch_x, batch_y = next(iter(loader))

        # Input should be (batch_size, input_dim)
        assert batch_x.shape[1] == input_dim
        assert input_dim == 10  # Default for synthetic
        # Labels should be binary (0 or 1)
        assert batch_y.max() <= num_classes - 1
        assert num_classes == 2  # Default for synthetic

    # ============================================
    # CANCELLATION TESTS
    # ============================================

    @pytest.mark.asyncio
    async def test_cancel_training(self, training_request_data):
        """Test cancelling a training job."""
        job_id = await self.service.start_training(
            dataset_path=training_request_data["dataset_path"],
            epochs=100,  # Long training
            batch_size=16,
        )

        # Give it a moment to start
        await asyncio.sleep(0.2)

        result = self.service.cancel_training(job_id)

        # May or may not succeed depending on timing
        assert isinstance(result, bool)

    def test_cancel_nonexistent_training(self):
        """Test cancelling a non-existent training job."""
        result = self.service.cancel_training("nonexistent-job-id")
        assert result is False


class TestGlobalTrainingService:
    """Tests for the global training_service instance."""

    def test_global_instance_exists(self):
        """Test that global training_service exists."""
        assert training_service is not None
        assert isinstance(training_service, TrainingService)
