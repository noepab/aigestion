"""
Middleware package for AIGestion IA Engine.
"""

from backend.app.middleware.metrics_middleware import PrometheusMiddleware

__all__ = ["PrometheusMiddleware"]
