"""
File Inference Service for AIGestion IA Engine.

Handles batch inference from uploaded files (CSV, JSON).
Supports both synchronous and background processing.
"""

import asyncio
import csv
import io
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

from app.config import get_settings
from app.services.inference_service import inference_service
from app.services.job_service import JobType, job_service
from app.services.metrics_service import metrics_service


class FileInferenceService:
    """
    Service for batch inference from files.

    Supported formats:
    - CSV: Each row is a sample, columns are features
    - JSON: Array of objects with "input_data" field
    - JSON Lines: One JSON object per line
    """

    # Maximum samples for synchronous processing
    MAX_SYNC_SAMPLES = 100

    def __init__(self):
        self.settings = get_settings()

    async def process_file(
        self, file_content: bytes, filename: str, async_processing: bool = False
    ) -> Dict[str, Any]:
        """
        Process a file for batch inference.

        Args:
            file_content: Raw file bytes
            filename: Original filename (used to detect format)
            async_processing: If True, process in background

        Returns:
            Dictionary with results or job_id for async processing
        """
        # Detect file format
        file_ext = Path(filename).suffix.lower()

        try:
            # Parse the file
            samples = self._parse_file(file_content, file_ext)

            if not samples:
                return {
                    "success": False,
                    "error": "No valid samples found in file",
                    "samples_found": 0,
                }

            # Decide sync vs async
            if async_processing or len(samples) > self.MAX_SYNC_SAMPLES:
                return await self._process_async(samples, filename)
            else:
                return await self._process_sync(samples, filename)

        except Exception as e:
            metrics_service.track_error(error_type=type(e).__name__, endpoint="/infer/file")
            return {"success": False, "error": str(e), "error_type": type(e).__name__}

    def _parse_file(self, file_content: bytes, file_ext: str) -> List[List[float]]:
        """
        Parse file content into list of input samples.

        Args:
            file_content: Raw file bytes
            file_ext: File extension (.csv, .json)

        Returns:
            List of input samples (each sample is a list of floats)
        """
        content_str = file_content.decode("utf-8")

        if file_ext == ".csv":
            return self._parse_csv(content_str)
        elif file_ext == ".json":
            return self._parse_json(content_str)
        elif file_ext == ".jsonl":
            return self._parse_jsonl(content_str)
        else:
            raise ValueError(f"Unsupported file format: {file_ext}")

    def _parse_csv(self, content: str) -> List[List[float]]:
        """Parse CSV content."""
        samples = []
        reader = csv.reader(io.StringIO(content))

        # Skip header if present (detect if first row is non-numeric)
        first_row = next(reader, None)
        if first_row:
            try:
                samples.append([float(x) for x in first_row])
            except ValueError:
                pass  # First row was header, skip it

        for row in reader:
            if row:
                try:
                    samples.append([float(x) for x in row])
                except ValueError:
                    continue  # Skip invalid rows

        return samples

    def _parse_json(self, content: str) -> List[List[float]]:
        """Parse JSON content."""
        data = json.loads(content)

        if isinstance(data, list):
            samples = []
            for item in data:
                if isinstance(item, dict) and "input_data" in item:
                    samples.append(item["input_data"])
                elif isinstance(item, list):
                    samples.append([float(x) for x in item])
            return samples
        elif isinstance(data, dict) and "samples" in data:
            return [s["input_data"] if isinstance(s, dict) else s for s in data["samples"]]
        else:
            raise ValueError("Invalid JSON format. Expected array or {samples: [...]}")

    def _parse_jsonl(self, content: str) -> List[List[float]]:
        """Parse JSON Lines content."""
        samples = []
        for line in content.strip().split("\n"):
            if line.strip():
                item = json.loads(line)
                if isinstance(item, dict) and "input_data" in item:
                    samples.append(item["input_data"])
                elif isinstance(item, list):
                    samples.append([float(x) for x in item])
        return samples

    async def _process_sync(self, samples: List[List[float]], filename: str) -> Dict[str, Any]:
        """
        Process samples synchronously.

        For small batches (< MAX_SYNC_SAMPLES).
        """
        start_time = datetime.utcnow()
        results = []
        errors = []

        for i, sample in enumerate(samples):
            try:
                result = inference_service.predict(sample)
                results.append(
                    {
                        "index": i,
                        "prediction": result["prediction"],
                        "confidence": result["confidence"],
                    }
                )
            except Exception as e:
                errors.append({"index": i, "error": str(e)})

        duration = (datetime.utcnow() - start_time).total_seconds()

        return {
            "success": True,
            "processing_mode": "sync",
            "filename": filename,
            "total_samples": len(samples),
            "successful": len(results),
            "failed": len(errors),
            "duration_seconds": duration,
            "results": results,
            "errors": errors if errors else None,
            "model_version": inference_service.settings.DEFAULT_MODEL,
        }

    async def _process_async(self, samples: List[List[float]], filename: str) -> Dict[str, Any]:
        """
        Process samples asynchronously as a background job.

        For large batches (>= MAX_SYNC_SAMPLES).
        """
        # Create job
        job = job_service.create_job(
            job_type=JobType.BATCH_INFERENCE,
            metadata={"filename": filename, "total_samples": len(samples)},
        )

        # Start background processing
        asyncio.create_task(self._run_batch_inference(job.job_id, samples, filename))

        return {
            "success": True,
            "processing_mode": "async",
            "job_id": job.job_id,
            "message": f"Processing {len(samples)} samples in background",
            "status_url": f"/jobs/{job.job_id}",
        }

    async def _run_batch_inference(self, job_id: str, samples: List[List[float]], filename: str):
        """Run batch inference in background."""
        try:
            job_service.start_job(job_id)
            job_service.update_progress(job_id, 0.0, "Starting batch inference...")

            total = len(samples)
            results = []
            errors = []

            for i, sample in enumerate(samples):
                try:
                    result = inference_service.predict(sample)
                    results.append(
                        {
                            "index": i,
                            "prediction": result["prediction"],
                            "confidence": result["confidence"],
                        }
                    )
                except Exception as e:
                    errors.append({"index": i, "error": str(e)})

                # Update progress every 10 samples
                if (i + 1) % 10 == 0 or i == total - 1:
                    progress = (i + 1) / total
                    job_service.update_progress(
                        job_id, progress, f"Processed {i + 1}/{total} samples"
                    )

                # Yield to event loop
                await asyncio.sleep(0)

            # Complete job
            job_service.complete_job(
                job_id,
                result={
                    "filename": filename,
                    "total_samples": total,
                    "successful": len(results),
                    "failed": len(errors),
                    "results": results,
                    "errors": errors if errors else None,
                    "model_version": inference_service.settings.DEFAULT_MODEL,
                },
                message=f"Batch inference completed: {len(results)}/{total} successful",
            )

        except Exception as e:
            job_service.fail_job(
                job_id, error=str(e), message=f"Batch inference failed: {type(e).__name__}"
            )


# Global file inference service instance
file_inference_service = FileInferenceService()
