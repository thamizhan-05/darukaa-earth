from __future__ import annotations

import math
import random

from app.integrations.weather.base import WeatherData, WeatherProvider


class MockWeatherProvider(WeatherProvider):
    async def get_weather(self, lat: float, lon: float) -> WeatherData:
        # Pseudo-deterministic microclimate based on coordinates
        seed = int(abs(lat * 100 + lon * 10))
        rnd = random.Random(seed)

        # Tropical Indian climate baseline
        temp = round(24.0 + 8.0 * math.sin(lat / 10.0) + rnd.uniform(-2.0, 3.0), 1)
        humidity = round(55.0 + 25.0 * math.cos(lon / 15.0) + rnd.uniform(-5.0, 5.0), 1)
        humidity = max(20.0, min(95.0, humidity))

        precip = round(max(0.0, rnd.gauss(1.5, 3.0)), 1)
        wind = round(rnd.uniform(5.0, 22.0), 1)
        soil_moisture = round(max(15.0, min(85.0, (humidity * 0.6) + (precip * 3.0))), 1)

        if precip > 5.0:
            condition = "Heavy Rain"
        elif precip > 0.5:
            condition = "Scattered Showers"
        elif humidity > 75:
            condition = "Overcast & Humid"
        elif temp > 30:
            condition = "Sunny & Warm"
        else:
            condition = "Partly Cloudy"

        return WeatherData(
            temperature_celsius=temp,
            humidity_pct=humidity,
            precipitation_mm=precip,
            wind_speed_kmh=wind,
            soil_moisture_pct=soil_moisture,
            condition=condition,
            source="Darukaa Microclimate Simulation Model",
            is_live=False,
        )
