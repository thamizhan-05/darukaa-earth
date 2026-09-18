from __future__ import annotations

from abc import ABC, abstractmethod

from pydantic import BaseModel


class WeatherData(BaseModel):
    temperature_celsius: float
    humidity_pct: float
    precipitation_mm: float
    wind_speed_kmh: float
    soil_moisture_pct: float
    condition: str
    source: str
    is_live: bool


class WeatherProvider(ABC):
    @abstractmethod
    async def get_weather(self, lat: float, lon: float) -> WeatherData:
        """Fetch weather data for geographic coordinates."""
        pass
