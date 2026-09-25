import { WeatherTelemetry } from "../types";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";

export async function fetchLiveWeather(lat: number, lng: number): Promise<WeatherTelemetry> {
  const defaultTelemetry: WeatherTelemetry = {
    temp: 29.5,
    windSpeed: 14.5, // km/h
    windDirection: "NE",
    waveHeight: 1.2, // meters
    tide: "Medium",
    stormSignal: 0,
  };

  try {
    // We try to pull real data from Open-Meteo Marine API
    // and Open-Meteo Weather API
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,wind_direction_10m&timezone=Asia/Manila`;
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height&timezone=Asia/Manila`;

    // Fetch weather + marine APIs in parallel (previously sequential double-fetch).
    // Each leg has an 8s AbortController timeout + 1 retry; failures fall
    // through to the deterministic offline simulation below.
    const weatherFetch = fetchWithTimeout(weatherUrl, { timeoutMs: 8000, retries: 1 }).then(
      async (weatherRes) => {
        if (!weatherRes.ok) throw new Error("Weather API failed");
        return weatherRes.json();
      }
    );
    const marineFetch = fetchWithTimeout(marineUrl, { timeoutMs: 8000, retries: 1 }).then(
      async (marineRes) => {
        if (!marineRes.ok) return null;
        return marineRes.json();
      }
    );

    const [weatherData, marineData] = await Promise.all([weatherFetch, marineFetch]);

    let temp = defaultTelemetry.temp;
    let windSpeed = defaultTelemetry.windSpeed;
    let windDirection = defaultTelemetry.windDirection;

    if (weatherData?.current) {
      temp = parseFloat(weatherData.current.temperature_2m || temp);
      windSpeed = parseFloat(weatherData.current.wind_speed_10m || windSpeed);
      
      const degrees = weatherData.current.wind_direction_10m || 0;
      const compassDirections = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
      const dirIndex = Math.round(degrees / 45) % 8;
      windDirection = compassDirections[dirIndex];
    }

    // Marine wave height already fetched in parallel above
    let waveHeight = defaultTelemetry.waveHeight;
    if (marineData?.current?.wave_height !== undefined) {
      waveHeight = parseFloat(marineData.current.wave_height);
    }

    // Determine tide and storm signals based on coordinates & random but stable hashes
    const coordSum = lat + lng;
    const tideOptions: ("High" | "Medium" | "Low")[] = ["High", "Medium", "Low"];
    const tide = tideOptions[Math.floor((coordSum * 10) % 3)];
    const stormSignal = (coordSum * 10) % 100 > 85 ? 1 : 0; // 15% chance of warning

    return {
      temp,
      windSpeed,
      windDirection,
      waveHeight,
      tide,
      stormSignal,
    };
  } catch (error) {
    console.warn("Error fetching live marine telemetry, using adaptive simulation:", error);
    // Return coordinate-dependent but deterministic simulated values so they remain consistent for a given port
    const hash = Math.sin(lat) * Math.cos(lng);
    const waveHeight = Math.abs(1.0 + parseFloat((hash * 1.5).toFixed(1)));
    const windSpeed = Math.abs(10 + parseFloat((hash * 20).toFixed(1)));
    const temp = parseFloat((28.5 + hash * 3.5).toFixed(1));
    const tide: "High" | "Medium" | "Low" = Math.abs(hash) > 0.6 ? "High" : Math.abs(hash) > 0.3 ? "Medium" : "Low";
    const stormSignal = Math.abs(hash) > 0.8 ? 1 : 0;

    return {
      temp,
      windSpeed,
      windDirection: hash > 0.5 ? "NE" : hash > 0 ? "E" : hash > -0.5 ? "SW" : "NW",
      waveHeight,
      tide,
      stormSignal,
    };
  }
}
