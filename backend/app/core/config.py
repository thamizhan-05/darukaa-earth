from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000

    # Database
    DATABASE_URL: str = "postgresql://darukaa_user:yourpassword@localhost:5432/darukaa_earth"

    # JWT
    JWT_SECRET: str = "darukaa_super_secret_jwt_key_for_development_and_tests_32char"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    # Optional external APIs & Earth Observation
    WEATHER_API_KEY: str | None = None
    EARTH_OBSERVATION_API_KEY: str | None = None
    EO_PROVIDER: str = "copernicus_telemetry"  # "copernicus_telemetry" | "copernicus_stac" | "sentinel_hub" | "mock"
    SENTINEL_HUB_CLIENT_ID: str | None = None
    SENTINEL_HUB_CLIENT_SECRET: str | None = None
    NASA_FIRMS_MAP_KEY: str | None = None
    AI_API_KEY: str | None = None

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
