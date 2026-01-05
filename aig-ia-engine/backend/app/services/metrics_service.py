"""
Prometheus Metrics Service for AIGestion IA Engine.

Provides custom metrics for monitoring inference performance,
model health, and system resources.
"""

from prometheus_client import (
    CONTENT_TYPE_LATEST,
    REGISTRY,
    Counter,
    Gauge,
    Histogram,
    Info,
    generate_latest,
)


class MetricsService:
    """
    Centralized metrics service for AIGestion IA Engine.

    Metrics Categories:
    - Request metrics (count, latency, errors)
    - Inference metrics (predictions, confidence, batch sizes)
    - Model metrics (load time, version, memory usage)
    - System metrics (GPU utilization, memory)
    """

    def __init__(self, prefix: str = "aigestion_ia"):
        self.prefix = prefix
        self._setup_metrics()

    def _setup_metrics(self):
        """Initialize all Prometheus metrics."""

        # ============================================
        # REQUEST METRICS
        # ============================================

        # Total requests counter
        self.request_count = Counter(
            f"{self.prefix}_requests_total",
            "Total number of requests received",
            ["method", "endpoint", "status"]
        )

        # Request latency histogram
        self.request_latency = Histogram(
            f"{self.prefix}_request_latency_seconds",
            "Request latency in seconds",
            ["method", "endpoint"],
            buckets=(0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0)
        )

        # Active requests gauge
        self.active_requests = Gauge(
            f"{self.prefix}_active_requests",
            "Number of requests currently being processed"
        )

        # ============================================
        # INFERENCE METRICS
        # ============================================

        # Total inferences counter
        self.inference_count = Counter(
            f"{self.prefix}_inferences_total",
            "Total number of inference requests",
            ["model_version", "status"]
        )

        # Inference latency histogram
        self.inference_latency = Histogram(
            f"{self.prefix}_inference_latency_seconds",
            "Inference latency in seconds",
            ["model_version"],
            buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0)
        )

        # Prediction confidence histogram
        self.prediction_confidence = Histogram(
            f"{self.prefix}_prediction_confidence",
            "Confidence score of predictions",
            ["model_version", "predicted_class"],
            buckets=(0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.99, 1.0)
        )

        # Batch size histogram
        self.batch_size = Histogram(
            f"{self.prefix}_batch_size",
            "Size of inference batches",
            ["model_version"],
            buckets=(1, 2, 4, 8, 16, 32, 64, 128)
        )

        # ============================================
        # MODEL METRICS
        # ============================================

        # Model info
        self.model_info = Info(
            f"{self.prefix}_model",
            "Information about the loaded model"
        )

        # Model load time gauge
        self.model_load_time = Gauge(
            f"{self.prefix}_model_load_time_seconds",
            "Time taken to load the model",
            ["model_version"]
        )

        # Model memory usage gauge
        self.model_memory_bytes = Gauge(
            f"{self.prefix}_model_memory_bytes",
            "Memory used by the model",
            ["model_version"]
        )

        # ============================================
        # SYSTEM METRICS
        # ============================================

        # GPU utilization (if available)
        self.gpu_utilization = Gauge(
            f"{self.prefix}_gpu_utilization_percent",
            "GPU utilization percentage",
            ["device"]
        )

        # GPU memory usage (if available)
        self.gpu_memory_bytes = Gauge(
            f"{self.prefix}_gpu_memory_bytes",
            "GPU memory usage in bytes",
            ["device", "type"]  # type: used, free, total
        )

        # CPU utilization
        self.cpu_utilization = Gauge(
            f"{self.prefix}_cpu_utilization_percent",
            "CPU utilization percentage"
        )

        # Memory utilization
        self.memory_utilization = Gauge(
            f"{self.prefix}_memory_utilization_percent",
            "Memory utilization percentage"
        )

        # ============================================
        # TRAINING METRICS (for retraining jobs)
        # ============================================

        # Active training jobs
        self.training_jobs_active = Gauge(
            f"{self.prefix}_training_jobs_active",
            "Number of active training jobs"
        )

        # Training jobs counter
        self.training_jobs_total = Counter(
            f"{self.prefix}_training_jobs_total",
            "Total number of training jobs",
            ["status"]  # started, completed, failed
        )

        # Training epoch counter
        self.training_epochs = Counter(
            f"{self.prefix}_training_epochs_total",
            "Total training epochs completed",
            ["job_id"]
        )

        # ============================================
        # ERROR METRICS
        # ============================================

        # Error counter by type
        self.errors_total = Counter(
            f"{self.prefix}_errors_total",
            "Total number of errors",
            ["error_type", "endpoint"]
        )

    # ============================================
    # HELPER METHODS
    # ============================================

    def track_request(self, method: str, endpoint: str, status: int):
        """Track a completed request."""
        self.request_count.labels(
            method=method,
            endpoint=endpoint,
            status=str(status)
        ).inc()

    def track_request_latency(self, method: str, endpoint: str, duration: float):
        """Track request latency."""
        self.request_latency.labels(
            method=method,
            endpoint=endpoint
        ).observe(duration)

    def track_inference(
        self,
        model_version: str,
        success: bool,
        latency: float,
        confidence: float,
        predicted_class: int,
        batch_size: int = 1
    ):
        """Track an inference operation."""
        status = "success" if success else "error"

        self.inference_count.labels(
            model_version=model_version,
            status=status
        ).inc()

        self.inference_latency.labels(
            model_version=model_version
        ).observe(latency)

        if success:
            self.prediction_confidence.labels(
                model_version=model_version,
                predicted_class=str(predicted_class)
            ).observe(confidence)

        self.batch_size.labels(
            model_version=model_version
        ).observe(batch_size)

    def set_model_info(
        self,
        model_version: str,
        model_type: str,
        input_dim: int,
        hidden_dim: int,
        device: str
    ):
        """Set model information."""
        self.model_info.info({
            "version": model_version,
            "type": model_type,
            "input_dim": str(input_dim),
            "hidden_dim": str(hidden_dim),
            "device": device
        })

    def set_model_load_time(self, model_version: str, load_time: float):
        """Set the model load time."""
        self.model_load_time.labels(
            model_version=model_version
        ).set(load_time)

    def track_error(self, error_type: str, endpoint: str):
        """Track an error occurrence."""
        self.errors_total.labels(
            error_type=error_type,
            endpoint=endpoint
        ).inc()

    def update_system_metrics(self):
        """Update system resource metrics (called periodically)."""
        try:
            import psutil

            # CPU utilization
            self.cpu_utilization.set(psutil.cpu_percent())

            # Memory utilization
            memory = psutil.virtual_memory()
            self.memory_utilization.set(memory.percent)

        except ImportError:
            pass  # psutil not installed

        # GPU metrics (if PyTorch with CUDA)
        try:
            import torch
            if torch.cuda.is_available():
                for i in range(torch.cuda.device_count()):
                    device_name = f"cuda:{i}"

                    # Memory usage
                    allocated = torch.cuda.memory_allocated(i)
                    reserved = torch.cuda.memory_reserved(i)

                    self.gpu_memory_bytes.labels(
                        device=device_name,
                        type="allocated"
                    ).set(allocated)

                    self.gpu_memory_bytes.labels(
                        device=device_name,
                        type="reserved"
                    ).set(reserved)
        except Exception:
            pass

    def generate_metrics(self) -> bytes:
        """Generate metrics in Prometheus format."""
        return generate_latest(REGISTRY)

    def get_content_type(self) -> str:
        """Get the content type for Prometheus metrics."""
        return CONTENT_TYPE_LATEST


# Global metrics instance
metrics_service = MetricsService()
