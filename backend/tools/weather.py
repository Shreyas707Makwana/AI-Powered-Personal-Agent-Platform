import os
import httpx
from typing import Dict, Any

TIMEOUT_SECONDS = float(os.getenv("TOOL_TIMEOUT_SECONDS", "10"))

class WeatherToolError(Exception):
    pass

async def fetch_weather(params: Dict[str, Any]) -> Dict[str, Any]:
    """Call OpenWeatherMap current weather endpoint.
    Expected params: {"city": str}
    Returns: { temp_c, description, city, source }
    """
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        raise WeatherToolError("OPENWEATHER_API_KEY not configured")

    city = (params or {}).get("city")
    if not isinstance(city, str) or not city.strip():
        raise WeatherToolError("Invalid or missing 'city' parameter")

    url = "https://api.openweathermap.org/data/2.5/weather"
    query = {"q": city, "appid": api_key, "units": "metric"}

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
            resp = await client.get(url, params=query)
            if resp.status_code == 401:
                raise WeatherToolError("Invalid OPENWEATHER_API_KEY or unauthorized")
            if resp.status_code == 404:
                raise WeatherToolError("City not found")
            resp.raise_for_status()
            data = resp.json()
            temp_c = data.get("main", {}).get("temp")
            description = None
            weather_list = data.get("weather") or []
            if weather_list and isinstance(weather_list, list):
                description = weather_list[0].get("description")
            return {
                "temp_c": temp_c,
                "description": description,
                "city": data.get("name") or city,
                "source": "openweathermap",
            }
    except httpx.TimeoutException:
        raise WeatherToolError("Weather service timeout")
    except httpx.HTTPError as e:
        raise WeatherToolError(f"Weather service error: {str(e)}")
