from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "aigestion-ia-engine"
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    APP_WORKERS: int = 4

    SECRET_KEY: str = "change-this-in-production-use-strong-key"
    API_KEY: Optional[str] = None
    ALLOWED_HOSTS: str = "localhost,127.0.0.1"

    DATABASE_URL: str = "sqlite:///./data/aigestion_ia.db"
    REDIS_URL: str = "redis://localhost:6379/0"

    MODEL_PATH: str = "./data/trained_models"
    DEFAULT_MODEL: str = "hope-lite-v1"

    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = "../../.env"
        extra = "ignore"  # Allow extra fields in .env file


@lru_cache()
def get_settings():
    return Settings()
