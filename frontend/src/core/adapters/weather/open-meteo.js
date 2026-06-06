// Adapter: implements WeatherProvider via Open-Meteo (free, no API key).
// Returns current temperature + a coarse condition + the place's LOCAL hour.
// Best-effort: null on failure.

import { fetchJson } from "../../shared/fetch-json.js";

const URL = "https://api.open-meteo.com/v1/forecast";

// WMO weather codes → short description + emoji.
function describe(code) {
  if (code === 0) return { description: "clear skies", emoji: "☀️" };
  if (code <= 2) return { description: "partly cloudy", emoji: "🌤️" };
  if (code === 3) return { description: "overcast", emoji: "☁️" };
  if (code <= 48) return { description: "foggy", emoji: "🌫️" };
  if (code <= 57) return { description: "drizzle", emoji: "🌦️" };
  if (code <= 67) return { description: "rain", emoji: "🌧️" };
  if (code <= 77) return { description: "snow", emoji: "🌨️" };
  if (code <= 82) return { description: "rain showers", emoji: "🌧️" };
  if (code <= 86) return { description: "snow showers", emoji: "🌨️" };
  return { description: "thunderstorm", emoji: "⛈️" };
}

function partOfDay(hour) {
  if (hour == null) return "";
  if (hour < 5) return "late night";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

/**
 * @param {{ http?: typeof fetchJson }} [deps]
 * @returns {import("../../ports/weather-provider.js").WeatherProvider}
 */
export function createOpenMeteoWeather({ http = fetchJson } = {}) {
  return {
    async current({ lat, lng }) {
      try {
        const url = `${URL}?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=auto`;
        const data = await http(url, { timeoutMs: 7000 });
        const cur = data?.current;
        if (!cur) return null;
        const { description, emoji } = describe(Number(cur.weather_code));
        // cur.time is local (timezone=auto), e.g. "2026-05-31T21:00"
        const hourMatch = /T(\d{2})/.exec(cur.time || "");
        const localHour = hourMatch ? Number(hourMatch[1]) : null;
        return {
          tempC: typeof cur.temperature_2m === "number" ? Math.round(cur.temperature_2m) : null,
          description,
          emoji,
          localHour,
          partOfDay: partOfDay(localHour),
        };
      } catch {
        return null;
      }
    },
  };
}
