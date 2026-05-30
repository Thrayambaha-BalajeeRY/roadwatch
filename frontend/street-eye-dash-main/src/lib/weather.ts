// Open-Meteo (no API key) — geocoding + current weather
export interface Weather {
  tempC: number;
  windKph: number;
  precipMm: number;
  isRaining: boolean;
  code: number;
  label: string;
  emoji: string;
  city: string;
  lat: number;
  lon: number;
}

const WMO: Record<number, { l: string; e: string; rain?: boolean }> = {
  0: { l: "Clear sky", e: "☀️" },
  1: { l: "Mainly clear", e: "🌤️" },
  2: { l: "Partly cloudy", e: "⛅" },
  3: { l: "Overcast", e: "☁️" },
  45: { l: "Fog", e: "🌫️" },
  48: { l: "Rime fog", e: "🌫️" },
  51: { l: "Light drizzle", e: "🌦️", rain: true },
  53: { l: "Drizzle", e: "🌦️", rain: true },
  55: { l: "Heavy drizzle", e: "🌧️", rain: true },
  61: { l: "Light rain", e: "🌦️", rain: true },
  63: { l: "Rain", e: "🌧️", rain: true },
  65: { l: "Heavy rain", e: "🌧️", rain: true },
  71: { l: "Light snow", e: "🌨️" },
  73: { l: "Snow", e: "❄️" },
  75: { l: "Heavy snow", e: "❄️" },
  80: { l: "Rain showers", e: "🌦️", rain: true },
  81: { l: "Heavy showers", e: "🌧️", rain: true },
  82: { l: "Violent showers", e: "⛈️", rain: true },
  95: { l: "Thunderstorm", e: "⛈️", rain: true },
  96: { l: "Storm + hail", e: "⛈️", rain: true },
  99: { l: "Severe storm", e: "⛈️", rain: true },
};

export async function geocode(place: string): Promise<{ lat: number; lon: number; name: string } | null> {
  try {
    const r = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=en&country=IN`,
    );
    const j = await r.json();
    const hit = j?.results?.[0];
    if (!hit) return null;
    return { lat: hit.latitude, lon: hit.longitude, name: hit.name };
  } catch {
    return null;
  }
}

export async function getWeather(lat: number, lon: number, city = ""): Promise<Weather | null> {
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code,wind_speed_10m`,
    );
    const j = await r.json();
    const c = j?.current;
    if (!c) return null;
    const meta = WMO[c.weather_code] ?? { l: "Unknown", e: "🌡️" };
    return {
      tempC: c.temperature_2m,
      windKph: c.wind_speed_10m,
      precipMm: c.precipitation,
      isRaining: !!meta.rain || c.precipitation > 0.1,
      code: c.weather_code,
      label: meta.l,
      emoji: meta.e,
      city,
      lat,
      lon,
    };
  } catch {
    return null;
  }
}

export async function getWeatherForPlace(place: string): Promise<Weather | null> {
  const g = await geocode(place);
  if (!g) return null;
  return getWeather(g.lat, g.lon, g.name);
}
