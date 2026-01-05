from app.api import routes
from app.config import get_settings
from app.middleware import PrometheusMiddleware
from app.middleware.zero_trust import ZeroTrustMiddleware
from app.logging_config import configure_logging
from app.services.metrics_service import metrics_service
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

# Configure Logging
configure_logging()

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.APP_DEBUG,
    version="0.1.0",
    description="AIGestion IA Engine - HOPE Architecture for intelligent inference",
)

# Prometheus Metrics Middleware (add first so it wraps all requests)
app.add_middleware(PrometheusMiddleware)

# Zero Trust Middleware - Security Layer
app.add_middleware(ZeroTrustMiddleware)

# CORS
origins = settings.ALLOWED_HOSTS.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(routes.router)


# ============================================
# HEALTH & READINESS ENDPOINTS
# ============================================
@app.get("/health")
async def health():
    """Basic health check."""
    return {"status": "ok", "service": "aigestion-ia-engine"}


@app.get("/ready")
async def readiness():
    """Deep readiness check for dependencies."""
    checks = {"redis": False, "database": False, "metrics": True}

    # Verify Redis
    try:
        from redis import Redis

        r = Redis.from_url(settings.REDIS_URL, socket_connect_timeout=1)
        if r.ping():
            checks["redis"] = True
    except:
        pass

    # Verify Database (SQLite check)
    try:
        if (
            os.path.exists("./data/aigestion_ia.db")
            or ":memory:" in settings.DATABASE_URL
        ):
            checks["database"] = True
    except:
        pass

    all_ok = all(checks.values())
    return {"status": "ready" if all_ok else "not_ready", "dependencies": checks}


# ============================================
# METRICS ENDPOINT
# ============================================
@app.get("/metrics", include_in_schema=False)
async def metrics():
    """
    Prometheus metrics endpoint.

    Returns metrics in Prometheus text format for scraping.
    """
    # Update system metrics before returning
    metrics_service.update_system_metrics()

    return Response(
        content=metrics_service.generate_metrics(),
        media_type=metrics_service.get_content_type(),
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.APP_DEBUG,
    )
