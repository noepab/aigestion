import time

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.services.redis_service import redis_service


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 20, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        route = request.url.path
        key = f"rate:{client_ip}:{route}"
        now = int(time.time())
        window_start = now - (now % self.window_seconds)
        redis_key = f"{key}:{window_start}"

        current = redis_service.get(redis_key)
        current = int(current) if current else 0

        if current >= self.max_requests:
            return Response(
                content="Rate limit exceeded. Try again later.",
                status_code=429
            )
        else:
            redis_service.set(redis_key, current + 1, ex=self.window_seconds)
            response = await call_next(request)
            return response
