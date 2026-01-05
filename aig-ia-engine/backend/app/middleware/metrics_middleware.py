"""
Prometheus Metrics Middleware for FastAPI.

Automatically tracks request count, latency, and active requests
for all incoming HTTP requests.
"""

import time

from backend.app.services.metrics_service import metrics_service
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class PrometheusMiddleware(BaseHTTPMiddleware):
    """
    Middleware to collect Prometheus metrics for all HTTP requests.

    Tracks:
    - Request count by method, endpoint, and status
    - Request latency by method and endpoint
    - Active requests (in-flight)
    """

    # Endpoints to exclude from detailed metrics (to avoid cardinality explosion)
    EXCLUDE_PATHS = {"/metrics", "/health", "/favicon.ico"}

    async def dispatch(self, request: Request, call_next) -> Response:
        # Skip metrics for excluded paths
        path = request.url.path
        if path in self.EXCLUDE_PATHS:
            return await call_next(request)

        # Normalize path to avoid high cardinality
        # e.g., /jobs/123 -> /jobs/{job_id}
        normalized_path = self._normalize_path(path)
        method = request.method

        # Track active requests
        metrics_service.active_requests.inc()

        # Record start time
        start_time = time.perf_counter()

        try:
            # Process the request
            response = await call_next(request)
            status_code = response.status_code

        except Exception as e:
            # Track errors
            metrics_service.track_error(
                error_type=type(e).__name__,
                endpoint=normalized_path
            )
            status_code = 500
            raise

        finally:
            # Calculate duration
            duration = time.perf_counter() - start_time

            # Decrement active requests
            metrics_service.active_requests.dec()

            # Track request metrics
            metrics_service.track_request(method, normalized_path, status_code)
            metrics_service.track_request_latency(method, normalized_path, duration)

        return response

    def _normalize_path(self, path: str) -> str:
        """
        Normalize path to reduce cardinality.

        Converts dynamic path segments to placeholders:
        - /jobs/123 -> /jobs/{id}
        - /models/hope-v1 -> /models/{model_id}
        """
        parts = path.strip("/").split("/")
        normalized_parts = []

        for i, part in enumerate(parts):
            # If part looks like an ID (numeric or UUID-like), normalize it
            if self._is_id_like(part):
                normalized_parts.append("{id}")
            else:
                normalized_parts.append(part)

        return "/" + "/".join(normalized_parts) if normalized_parts else "/"

    def _is_id_like(self, part: str) -> bool:
        """Check if a path part looks like an ID."""
        # Numeric IDs
        if part.isdigit():
            return True

        # UUID-like (contains only hex chars and dashes, length > 8)
        if len(part) > 8 and all(c in "0123456789abcdefABCDEF-" for c in part):
            return True

        return False
