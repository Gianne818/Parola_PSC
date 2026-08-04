import requests

from config import get_settings

settings = get_settings()
LATITUDE = settings["weather"]["latitude"]
LONGITUDE = settings["weather"]["longitude"]


def get_weather():

    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={LATITUDE}"
        f"&longitude={LONGITUDE}"
        "&current="
        "temperature_2m,"
        "relative_humidity_2m,"
        "wind_speed_10m,"
        "wind_direction_10m"
    )

    response = requests.get(url)

    response.raise_for_status()

    current = response.json()["current"]

    return [
        {
            "latitude": LATITUDE,
            "longitude": LONGITUDE,
            "observation_time": current["time"],
            "temperature": current["temperature_2m"],
            "humidity": current["relative_humidity_2m"],
            "wind_speed": current["wind_speed_10m"],
            "wind_direction": current["wind_direction_10m"]
        }
    ]