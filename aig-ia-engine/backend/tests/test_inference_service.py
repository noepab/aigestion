"""
Unit tests for the Inference Service.

Tests model loading, prediction, and metrics tracking.
"""

import pytest
import torch
from app.models.hope import HOPEExtractor, create_hope_lite
from app.services.inference_service import InferenceService, inference_service


class TestInferenceService:
    """Tests for InferenceService class."""

    def setup_method(self):
        """Create a fresh inference service for each test."""
        self.service = InferenceService()

    # ============================================
    # INITIALIZATION TESTS
    # ============================================

    def test_service_initializes_model(self):
        """Test that service loads model on initialization."""
        assert self.service.model is not None
        assert isinstance(self.service.model, HOPEExtractor)

    def test_service_sets_device(self):
        """Test that service sets appropriate device."""
        assert self.service.device is not None
        # Should be cpu or cuda
        assert str(self.service.device) in ["cpu", "cuda:0", "cuda"]

    def test_model_is_in_eval_mode(self):
        """Test that model is in evaluation mode."""
        assert not self.service.model.training

    # ============================================
    # PREDICTION TESTS
    # ============================================

    def test_predict_returns_dict(self, sample_input_data):
        """Test that predict returns a dictionary."""
        result = self.service.predict(sample_input_data)

        assert isinstance(result, dict)

    def test_predict_contains_required_keys(self, sample_input_data):
        """Test that prediction contains all required keys."""
        result = self.service.predict(sample_input_data)

        assert "prediction" in result
        assert "confidence" in result
        assert "model_version" in result

    def test_predict_returns_valid_class(self, sample_input_data):
        """Test that prediction is a valid class index."""
        result = self.service.predict(sample_input_data)

        assert isinstance(result["prediction"], int)
        assert result["prediction"] >= 0

    def test_predict_confidence_is_probability(self, sample_input_data):
        """Test that confidence is between 0 and 1."""
        result = self.service.predict(sample_input_data)

        assert isinstance(result["confidence"], float)
        assert 0.0 <= result["confidence"] <= 1.0

    def test_predict_returns_model_version(self, sample_input_data):
        """Test that model version is returned."""
        result = self.service.predict(sample_input_data)

        assert result["model_version"] == self.service.settings.DEFAULT_MODEL

    def test_predict_with_different_inputs(self):
        """Test predictions with different input data."""
        input1 = [1.0] * 10
        input2 = [10.0] * 10

        result1 = self.service.predict(input1)
        result2 = self.service.predict(input2)

        # Both should return valid predictions
        assert result1["prediction"] is not None
        assert result2["prediction"] is not None

    def test_predict_is_deterministic(self, sample_input_data):
        """Test that predictions are deterministic in eval mode."""
        result1 = self.service.predict(sample_input_data)
        result2 = self.service.predict(sample_input_data)

        assert result1["prediction"] == result2["prediction"]
        assert abs(result1["confidence"] - result2["confidence"]) < 1e-6

    # ============================================
    # ERROR HANDLING TESTS
    # ============================================

    def test_predict_with_empty_input(self):
        """Test that empty input raises an error."""
        with pytest.raises(Exception):
            self.service.predict([])

    def test_predict_with_wrong_dimension(self):
        """Test that wrong input dimension raises an error."""
        wrong_dim_input = [1.0] * 5  # Wrong dimension

        with pytest.raises(Exception):
            self.service.predict(wrong_dim_input)


class TestGlobalInferenceService:
    """Tests for the global inference_service instance."""

    def test_global_instance_exists(self):
        """Test that global inference_service exists."""
        assert inference_service is not None
        assert isinstance(inference_service, InferenceService)

    def test_global_instance_has_model(self):
        """Test that global instance has loaded model."""
        assert inference_service.model is not None


class TestHOPEModel:
    """Tests for the HOPE model architecture."""

    def test_create_hope_lite_returns_model(self):
        """Test that create_hope_lite returns a model."""
        model = create_hope_lite()

        assert model is not None
        assert isinstance(model, HOPEExtractor)

    def test_model_forward_pass(self):
        """Test forward pass through the model."""
        model = create_hope_lite(input_dim=10, hidden_dim=64, num_classes=2)
        model.eval()

        input_tensor = torch.randn(1, 10)
        output = model(input_tensor)

        assert output.shape == (1, 2)

    def test_model_batch_forward(self):
        """Test batch forward pass."""
        model = create_hope_lite(input_dim=10, hidden_dim=64, num_classes=2)
        model.eval()

        batch_input = torch.randn(8, 10)
        output = model(batch_input)

        assert output.shape == (8, 2)

    def test_model_custom_dimensions(self):
        """Test model with custom dimensions."""
        model = create_hope_lite(input_dim=20, hidden_dim=128, num_classes=5)
        model.eval()

        input_tensor = torch.randn(1, 20)
        output = model(input_tensor)

        assert output.shape == (1, 5)

    def test_model_gradients_in_training(self):
        """Test that gradients flow in training mode."""
        model = create_hope_lite()
        model.train()

        # BatchNorm1d requires batch size > 1 in training mode
        input_tensor = torch.randn(2, 10, requires_grad=True)
        output = model(input_tensor)
        loss = output.sum()
        loss.backward()

        assert input_tensor.grad is not None
