import asyncio
import os

import numpy as np
import pytest
from app.services.job_service import JobStatus, job_service
from app.services.training_service import TrainingService


@pytest.mark.asyncio
async def test_training_with_real_csv():
    """
    Test full training pipeline with a generated CSV file.
    Verifies that:
    1. CSV is loaded correctly.
    2. Input dimensions and classes are inferred.
    3. Model trains without error.
    4. Job completes successfully.
    """
    # 1. Create a temporary CSV
    csv_path = "temp_test_data.csv"
    num_samples = 50
    input_dim = 5
    num_classes = 3

    # Create random data: 5 columns features, 1 column target
    X = np.random.randn(num_samples, input_dim)
    y = np.random.randint(0, num_classes, num_samples)
    data = np.column_stack((X, y))

    # Headers
    headers = ",".join([f"col_{i}" for i in range(input_dim)] + ["target"])

    np.savetxt(csv_path, data, delimiter=",", header=headers, comments="")

    try:
        service = TrainingService()

        # 2. Start training
        job_id = await service.start_training(dataset_path=csv_path, epochs=2, batch_size=10)

        # 3. Wait for completion
        for _ in range(50):
            await asyncio.sleep(0.1)
            job = job_service.get_job(job_id)
            if job.status in [JobStatus.COMPLETED, JobStatus.FAILED]:
                break

        # 4. Handle Failure
        if job.status == JobStatus.FAILED:
            pytest.fail(f"Training failed with error: {job.error}")

        # 5. Assertions
        assert job.status == JobStatus.COMPLETED
        assert job.result["input_dim"] == input_dim
        assert job.result["num_classes"] == num_classes
        assert "final_loss" in job.result

    finally:
        # Cleanup
        if os.path.exists(csv_path):
            os.remove(csv_path)
