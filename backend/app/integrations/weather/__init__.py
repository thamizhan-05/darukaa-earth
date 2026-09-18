from __future__ import annotations

from app.core.config import get_settings
from app.integrations.weather.base import WeatherData, WeatherProvider
from app.integrations.weather.mock import MockWeatherProvider
from app.integrations.weather.openmeteo import OpenMeteoProvider
from app.integrations.weather.openweather import OpenWeatherProvider


def get_weather_provider() -> WeatherProvider:
    settings = get_settings()
    if settings.WEATHER_API_KEY:
        return OpenWeatherProvider(api_key=settings.WEATHER_API_KEY)
    return OpenMeteoProvider()


__all__ = [
    "WeatherProvider",
    "WeatherData",
    "MockWeatherProvider",
    "OpenMeteoProvider",
    "OpenWeatherProvider",
    "get_weather_provider",
]
