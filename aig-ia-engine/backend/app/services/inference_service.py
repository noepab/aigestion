import time

import torch

from app.config import get_settings
from app.models.hope import create_hope_lite
from app.services.metrics_service import metrics_service


class InferenceService:
    def __init__(self):
        self.settings = get_settings()
        self.model = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._load_model()

    def _load_model(self):
        """Load the HOPE model and track loading time."""
        start_time = time.perf_counter()

        # In a real scenario, load weights from self.settings.MODEL_PATH
        # Here we just initialize a random model for "lite" version
        self.model = create_hope_lite()
        self.model.to(self.device)
        self.model.eval()

        load_time = time.perf_counter() - start_time

        # Track model load time
        metrics_service.set_model_load_time(self.settings.DEFAULT_MODEL, load_time)

        # Set model info for metrics
        metrics_service.set_model_info(
            model_version=self.settings.DEFAULT_MODEL,
            model_type="HOPEExtractor",
            input_dim=10,
            hidden_dim=64,
            device=str(self.device),
        )

        print(f"Model {self.settings.DEFAULT_MODEL} loaded on {self.device} in {load_time:.3f}s")

    def predict(self, input_data: list):
        """
        Run inference and track metrics.

        Args:
            input_data: List of input features

        Returns:
            Dictionary with prediction, confidence, and model version
        """
        if not self.model:
            self._load_model()

        start_time = time.perf_counter()
        success = False
        predicted_class = -1
        confidence_score = 0.0

        try:
            tensor_data = torch.FloatTensor([input_data]).to(self.device)
            batch_size = tensor_data.shape[0]

            with torch.no_grad():
                output = self.model(tensor_data)
                probabilities = torch.softmax(output, dim=1)
                confidence, predicted = torch.max(probabilities, 1)

            predicted_class = int(predicted.item())
            confidence_score = float(confidence.item())
            success = True

            result = {
                "prediction": predicted_class,
                "confidence": confidence_score,
                "model_version": self.settings.DEFAULT_MODEL,
            }

            return result

        except Exception as e:
            metrics_service.track_error(error_type=type(e).__name__, endpoint="/infer")
            raise

        finally:
            # Track inference metrics
            latency = time.perf_counter() - start_time
            metrics_service.track_inference(
                model_version=self.settings.DEFAULT_MODEL,
                success=success,
                latency=latency,
                confidence=confidence_score,
                predicted_class=predicted_class,
                batch_size=batch_size if success else 1,
            )


# Global instance
inference_service = InferenceService()
