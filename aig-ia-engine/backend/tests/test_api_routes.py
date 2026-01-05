"""
Integration tests for API Routes.

Tests the FastAPI endpoints using TestClient.
"""

import pytest
from app.main import app
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


class TestHealthEndpoint:
    """Tests for /health endpoint."""

    def test_health_returns_200(self, client):
        """Test that health endpoint returns 200."""
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_returns_ok_status(self, client):
        """Test that health endpoint returns ok status."""
        response = client.get("/health")
        data = response.json()

        assert data["status"] == "ok"

    def test_health_contains_app_name(self, client):
        """Test that health response contains app name."""
        response = client.get("/health")
        data = response.json()

        assert "app_name" in data
        assert data["app_name"] == "aigestion-ia-engine"

    def test_health_contains_env(self, client):
        """Test that health response contains environment."""
        response = client.get("/health")
        data = response.json()

        assert "env" in data


class TestInferEndpoint:
    """Tests for /infer endpoint."""

    def test_infer_returns_200(self, client, sample_input_data):
        """Test that infer endpoint returns 200."""
        response = client.post(
            "/infer",
            json={"input_data": sample_input_data}
        )
        assert response.status_code == 200

    def test_infer_returns_prediction(self, client, sample_input_data):
        """Test that infer returns prediction."""
        response = client.post(
            "/infer",
            json={"input_data": sample_input_data}
        )
        data = response.json()

        assert "prediction" in data
        assert isinstance(data["prediction"], int)

    def test_infer_returns_confidence(self, client, sample_input_data):
        """Test that infer returns confidence."""
        response = client.post(
            "/infer",
            json={"input_data": sample_input_data}
        )
        data = response.json()

        assert "confidence" in data
        assert 0 <= data["confidence"] <= 1

    def test_infer_returns_model_version(self, client, sample_input_data):
        """Test that infer returns model version."""
        response = client.post(
            "/infer",
            json={"input_data": sample_input_data}
        )
        data = response.json()

        assert "model_version" in data

    def test_infer_with_empty_input(self, client):
        """Test that empty input returns error."""
        response = client.post(
            "/infer",
            json={"input_data": []}
        )
        # Should fail validation
        assert response.status_code == 422

    def test_infer_with_wrong_type(self, client):
        """Test that wrong input type returns error."""
        response = client.post(
            "/infer",
            json={"input_data": "not a list"}
        )
        assert response.status_code == 422


class TestInferFileEndpoint:
    """Tests for /infer/file endpoint."""

    def test_infer_file_csv(self, client, sample_csv_content):
        """Test file inference with CSV."""
        response = client.post(
            "/infer/file",
            files={"file": ("test.csv", sample_csv_content, "text/csv")}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_infer_file_json(self, client, sample_json_content):
        """Test file inference with JSON."""
        response = client.post(
            "/infer/file",
            files={"file": ("test.json", sample_json_content, "application/json")}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_infer_file_returns_results(self, client, sample_csv_content):
        """Test that file inference returns results."""
        response = client.post(
            "/infer/file",
            files={"file": ("test.csv", sample_csv_content, "text/csv")}
        )

        data = response.json()
        assert "results" in data
        assert len(data["results"]) > 0

    def test_infer_file_async_mode(self, client, sample_csv_content):
        """Test file inference with async mode."""
        response = client.post(
            "/infer/file?async_processing=true",
            files={"file": ("test.csv", sample_csv_content, "text/csv")}
        )

        data = response.json()
        assert data["processing_mode"] == "async"
        assert "job_id" in data


class TestRetrainEndpoint:
    """Tests for /retrain endpoint."""

    def test_retrain_returns_200(self, client, training_request_data):
        """Test that retrain endpoint returns 200."""
        response = client.post("/retrain", json=training_request_data)
        assert response.status_code == 200

    def test_retrain_returns_job_id(self, client, training_request_data):
        """Test that retrain returns job ID."""
        response = client.post("/retrain", json=training_request_data)
        data = response.json()

        assert "job_id" in data
        assert len(data["job_id"]) == 36

    def test_retrain_returns_status_url(self, client, training_request_data):
        """Test that retrain returns status URL."""
        response = client.post("/retrain", json=training_request_data)
        data = response.json()

        assert "status_url" in data
        assert data["status_url"].startswith("/jobs/")

    def test_retrain_with_defaults(self, client):
        """Test retrain with only required field."""
        response = client.post(
            "/retrain",
            json={"dataset_path": "./data/train.csv"}
        )

        assert response.status_code == 200


class TestJobsEndpoint:
    """Tests for /jobs endpoints."""

    def test_list_jobs_returns_200(self, client):
        """Test that list jobs returns 200."""
        response = client.get("/jobs")
        assert response.status_code == 200

    def test_list_jobs_returns_list(self, client):
        """Test that list jobs returns a list."""
        response = client.get("/jobs")
        data = response.json()

        assert "jobs" in data
        assert isinstance(data["jobs"], list)

    def test_list_jobs_with_limit(self, client):
        """Test list jobs with limit parameter."""
        response = client.get("/jobs?limit=5")
        data = response.json()

        assert len(data["jobs"]) <= 5

    def test_get_job_not_found(self, client):
        """Test getting non-existent job returns 404."""
        response = client.get("/jobs/nonexistent-job-id")
        assert response.status_code == 404

    def test_get_job_after_create(self, client, training_request_data):
        """Test getting a job that was just created."""
        # Create a job
        create_response = client.post("/retrain", json=training_request_data)
        job_id = create_response.json()["job_id"]

        # Get the job
        get_response = client.get(f"/jobs/{job_id}")
        assert get_response.status_code == 200

        data = get_response.json()
        assert data["job_id"] == job_id

    def test_cancel_job_not_found(self, client):
        """Test cancelling non-existent job returns 404."""
        response = client.post("/jobs/nonexistent-job-id/cancel")
        assert response.status_code == 404


class TestModelsEndpoint:
    """Tests for /models endpoint."""

    def test_models_returns_200(self, client):
        """Test that models endpoint returns 200."""
        response = client.get("/models")
        assert response.status_code == 200

    def test_models_returns_active_model(self, client):
        """Test that models returns active model."""
        response = client.get("/models")
        data = response.json()

        assert "active_model" in data

    def test_models_returns_available_models(self, client):
        """Test that models returns available models list."""
        response = client.get("/models")
        data = response.json()

        assert "available_models" in data
        assert isinstance(data["available_models"], list)


class TestMetricsEndpoint:
    """Tests for /metrics endpoint."""

    def test_metrics_returns_200(self, client):
        """Test that metrics endpoint returns 200."""
        response = client.get("/metrics")
        assert response.status_code == 200

    def test_metrics_returns_prometheus_format(self, client):
        """Test that metrics returns Prometheus format."""
        response = client.get("/metrics")

        # Prometheus metrics should contain HELP and TYPE comments
        content = response.text
        assert "# HELP" in content or "# TYPE" in content

    def test_metrics_contains_custom_metrics(self, client):
        """Test that metrics contains our custom aigestion_ia_ metrics."""
        response = client.get("/metrics")
        content = response.text

        # Should contain at least one of our custom metrics
        assert "aigestion_ia_" in content
