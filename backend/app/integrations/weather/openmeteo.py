from __future__ import annotations

import logging

import httpx

from app.integrations.weather.base import WeatherData, WeatherProvider
from app.integrations.weather.mock import MockWeatherProvider

logger = logging.getLogger("darukaa.weather.openmeteo")

WMO_WEATHER_CODES = {
    0: "Clear Sky",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing Rime Fog",
    51: "Light Drizzle",
    53: "Moderate Drizzle",
    55: "Dense Drizzle",
    61: "Slight Rain",
    63: "Moderate Rain",
    65: "Heavy Rain",
    71: "Slight Snowfall",
    73: "Moderate Snowfall",
    75: "Heavy Snowfall",
    80: "Slight Rain Showers",
    81: "Moderate Rain Showers",
    82: "Violent Rain Showers",
    95: "Thunderstorm",
    96: "Thunderstorm with Slight Hail",
    99: "Thunderstorm with Heavy Hail",
}


class OpenMeteoProvider(WeatherProvider):
    """
    Live real-time meteorological provider powered by the open-access
    Open-Meteo Global Meteorological Telemetry Network.
    Requires no proprietary API keys.
    """

    def __init__(self):
        self.fallback = MockWeatherProvider()

    async def get_weather(self, lat: float, lon: float) -> WeatherData:
        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            f"&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,soil_moisture_0_to_1cm,weather_code"
        )
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    current = data.get("current", {})

                    temp = float(current.get("temperature_2m", 24.0))
                    humidity = float(current.get("relative_humidity_2m", 65.0))
                    precip = float(current.get("precipitation", 0.0))
                    wind_speed = float(current.get("wind_speed_10m", 5.0))

                    # soil moisture is given as m3/m3 (0.0 to 1.0)
                    raw_soil = current.get("soil_moisture_0_to_1cm")
                    if raw_soil is not None:
                        soil_moisture = round(float(raw_soil) * 100.0, 1)
                    else:
                        soil_moisture = round(
                            max(10.0, min(90.0, humidity * 0.6 + precip * 5.0)), 1
                        )

                    code = current.get("weather_code", 0)
                    condition = WMO_WEATHER_CODES.get(code, "Clear Sky")

                    return WeatherData(
                        temperature_celsius=round(temp, 1),
                        humidity_pct=round(humidity, 1),
                        precipitation_mm=round(precip, 1),
                        wind_speed_kmh=round(wind_speed, 1),
                        soil_moisture_pct=soil_moisture,
                        condition=condition,
                        source="Open-Meteo Real-Time Atmospheric Station",
                        is_live=True,
                    )
        except Exception as e:
            logger.warning(
                f"Open-Meteo live query failed for ({lat}, {lon}): {e}. Falling back to baseline simulation."
            )

        return await self.fallback.get_weather(lat, lon)
