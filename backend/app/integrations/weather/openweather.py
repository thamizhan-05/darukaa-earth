from __future__ import annotations

import httpx

from app.integrations.weather.base import WeatherData, WeatherProvider
from app.integrations.weather.mock import MockWeatherProvider


class OpenWeatherProvider(WeatherProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.fallback = MockWeatherProvider()

    async def get_weather(self, lat: float, lon: float) -> WeatherData:
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={self.api_key}&units=metric"
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    main = data.get("main", {})
                    wind = data.get("wind", {})
                    rain = data.get("rain", {}).get("1h", 0.0)
                    weather = data.get("weather", [{}])[0]

                    temp = float(main.get("temp", 25.0))
                    humidity = float(main.get("humidity", 60.0))
                    wind_speed = float(wind.get("speed", 3.0)) * 3.6  # m/s -> km/h
                    condition = weather.get("description", "Clear").title()

                    # Approximate soil moisture
                    soil_moisture = round(max(10.0, min(90.0, humidity * 0.7 + rain * 4.0)), 1)

                    return WeatherData(
                        temperature_celsius=round(temp, 1),
                        humidity_pct=round(humidity, 1),
                        precipitation_mm=round(float(rain), 1),
                        wind_speed_kmh=round(wind_speed, 1),
                        soil_moisture_pct=soil_moisture,
                        condition=condition,
                        source="OpenWeatherMap OneCall API (Live)",
                        is_live=True,
                    )
        except Exception:
            # Graceful degradation to simulated model
            pass

        return await self.fallback.get_weather(lat, lon)
