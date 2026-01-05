"""
Unit tests for the File Inference Service.

Tests file parsing and batch inference functionality.
"""

import json

import pytest
from app.services.file_inference_service import (
    FileInferenceService,
    file_inference_service,
)


class TestFileInferenceService:
    """Tests for FileInferenceService class."""

    def setup_method(self):
        """Create a fresh file inference service for each test."""
        self.service = FileInferenceService()

    # ============================================
    # CSV PARSING TESTS
    # ============================================

    def test_parse_csv_basic(self, sample_csv_content):
        """Test parsing basic CSV content."""
        samples = self.service._parse_file(sample_csv_content, ".csv")

        assert len(samples) == 3
        assert len(samples[0]) == 10

    def test_parse_csv_with_header(self):
        """Test parsing CSV with header row."""
        csv_content = b"""a,b,c,d,e,f,g,h,i,j
1.0,2.0,3.0,4.0,5.0,6.0,7.0,8.0,9.0,10.0
2.0,3.0,4.0,5.0,6.0,7.0,8.0,9.0,10.0,11.0"""

        samples = self.service._parse_file(csv_content, ".csv")

        # Header should be skipped
        assert len(samples) == 2

    def test_parse_csv_with_blank_lines(self):
        """Test parsing CSV with blank lines."""
        csv_content = b"""1.0,2.0,3.0,4.0,5.0,6.0,7.0,8.0,9.0,10.0

2.0,3.0,4.0,5.0,6.0,7.0,8.0,9.0,10.0,11.0"""

        samples = self.service._parse_file(csv_content, ".csv")

        assert len(samples) == 2

    # ============================================
    # JSON PARSING TESTS
    # ============================================

    def test_parse_json_array_of_objects(self, sample_json_content):
        """Test parsing JSON array of objects."""
        samples = self.service._parse_file(sample_json_content, ".json")

        assert len(samples) == 3
        assert len(samples[0]) == 10

    def test_parse_json_array_of_arrays(self):
        """Test parsing JSON array of arrays."""
        json_content = json.dumps(
            [
                [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0],
                [2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0],
            ]
        ).encode()

        samples = self.service._parse_file(json_content, ".json")

        assert len(samples) == 2

    def test_parse_json_with_samples_key(self):
        """Test parsing JSON with 'samples' key."""
        json_content = json.dumps(
            {
                "samples": [
                    {"input_data": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0]},
                    {"input_data": [2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0]},
                ]
            }
        ).encode()

        samples = self.service._parse_file(json_content, ".json")

        assert len(samples) == 2

    # ============================================
    # JSONL PARSING TESTS
    # ============================================

    def test_parse_jsonl_basic(self, sample_jsonl_content):
        """Test parsing JSONL content."""
        samples = self.service._parse_file(sample_jsonl_content, ".jsonl")

        assert len(samples) == 3
        assert len(samples[0]) == 10

    def test_parse_jsonl_with_arrays(self):
        """Test parsing JSONL with array format."""
        jsonl_content = "\n".join(
            [
                json.dumps([1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0]),
                json.dumps([2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0]),
            ]
        ).encode()

        samples = self.service._parse_file(jsonl_content, ".jsonl")

        assert len(samples) == 2

    # ============================================
    # UNSUPPORTED FORMAT TESTS
    # ============================================

    def test_parse_unsupported_format(self):
        """Test that unsupported formats raise ValueError."""
        with pytest.raises(ValueError, match="Unsupported file format"):
            self.service._parse_file(b"some content", ".xyz")

    # ============================================
    # SYNC PROCESSING TESTS
    # ============================================

    @pytest.mark.asyncio
    async def test_process_file_sync_csv(self, sample_csv_content):
        """Test synchronous processing of CSV file."""
        result = await self.service.process_file(
            file_content=sample_csv_content, filename="test.csv", async_processing=False
        )

        assert result["success"] is True
        assert result["processing_mode"] == "sync"
        assert result["total_samples"] == 3
        assert result["successful"] == 3
        assert "results" in result

    @pytest.mark.asyncio
    async def test_process_file_sync_json(self, sample_json_content):
        """Test synchronous processing of JSON file."""
        result = await self.service.process_file(
            file_content=sample_json_content, filename="test.json", async_processing=False
        )

        assert result["success"] is True
        assert result["processing_mode"] == "sync"
        assert result["total_samples"] == 3

    @pytest.mark.asyncio
    async def test_process_file_returns_results(self, sample_csv_content):
        """Test that sync processing returns individual results."""
        result = await self.service.process_file(
            file_content=sample_csv_content, filename="test.csv", async_processing=False
        )

        assert len(result["results"]) == 3
        for r in result["results"]:
            assert "index" in r
            assert "prediction" in r
            assert "confidence" in r

    @pytest.mark.asyncio
    async def test_process_file_includes_duration(self, sample_csv_content):
        """Test that sync processing includes duration."""
        result = await self.service.process_file(
            file_content=sample_csv_content, filename="test.csv", async_processing=False
        )

        assert "duration_seconds" in result
        assert result["duration_seconds"] >= 0

    # ============================================
    # ASYNC PROCESSING TESTS
    # ============================================

    @pytest.mark.asyncio
    async def test_process_file_async_returns_job_id(self, sample_csv_content):
        """Test that async processing returns job_id."""
        result = await self.service.process_file(
            file_content=sample_csv_content, filename="test.csv", async_processing=True
        )

        assert result["success"] is True
        assert result["processing_mode"] == "async"
        assert "job_id" in result
        assert "status_url" in result

    # ============================================
    # ERROR HANDLING TESTS
    # ============================================

    @pytest.mark.asyncio
    async def test_process_empty_file(self):
        """Test processing empty file."""
        result = await self.service.process_file(
            file_content=b"", filename="empty.csv", async_processing=False
        )

        assert result["success"] is False
        assert "error" in result

    @pytest.mark.asyncio
    async def test_process_invalid_json(self):
        """Test processing invalid JSON file."""
        result = await self.service.process_file(
            file_content=b"not valid json", filename="invalid.json", async_processing=False
        )

        assert result["success"] is False
        assert "error" in result


class TestGlobalFileInferenceService:
    """Tests for the global file_inference_service instance."""

    def test_global_instance_exists(self):
        """Test that global file_inference_service exists."""
        assert file_inference_service is not None
        assert isinstance(file_inference_service, FileInferenceService)
