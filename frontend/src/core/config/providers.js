// Composition root: the ONLY place that knows which concrete adapters are active.
// Providers are selected by env var and looked up in registries. Swapping or
// adding a provider = one registry line + an env var. The service, the route,
// and the UI never reference a concrete provider.

import { createOpenAICompatibleInterpreter } from "../adapters/interpreters/openai-compatible.js";
import { createRuleBasedInterpreter } from "../adapters/interpreters/rule-based.js";
import { createFallbackInterpreter } from "../adapters/interpreters/fallback.js";
import { createItunesResolver } from "../adapters/resolvers/itunes.js";
import { createNominatimGeocoder } from "../adapters/geocoders/nominatim.js";
import { createAppleRssChartProvider } from "../adapters/charts/apple-rss.js";
import { createOpenMeteoWeather } from "../adapters/weather/open-meteo.js";
import { createItunesCatalog } from "../adapters/catalog/itunes.js";
import { createVibe } from "../services/create-vibe.js";
import { ConfigError } from "../domain/errors.js";

/** @type {Record<string, () => import("../ports/mood-interpreter.js").MoodInterpreter>} */
const interpreters = {
  groq: () =>
    createOpenAICompatibleInterpreter({
      apiKey: process.env.GROQ_API_KEY,
      baseUrl: "https://api.groq.com/openai/v1",
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      briefModel: process.env.GROQ_BRIEF_MODEL || "llama-3.1-8b-instant",
      fallbackModel: process.env.GROQ_FALLBACK_MODEL || "llama-3.1-8b-instant",
    }),
  gemini: () =>
    createOpenAICompatibleInterpreter({
      apiKey: process.env.GEMINI_API_KEY,
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      briefModel: process.env.GEMINI_BRIEF_MODEL || "gemini-2.5-flash",
      fallbackModel: process.env.GEMINI_FALLBACK_MODEL || "gemini-flash-latest",
      // Disable Gemini's default "thinking" — big latency cut for our JSON output.
      extraBody: { reasoning_effort: "none" },
    }),
  "rule-based": () => createRuleBasedInterpreter(),
};

/** @type {Record<string, () => import("../ports/track-resolver.js").TrackResolver>} */
const resolvers = {
  itunes: () => createItunesResolver(),
};

/** @type {Record<string, () => import("../ports/geocoder.js").Geocoder>} */
const geocoders = {
  nominatim: () => createNominatimGeocoder(),
};

/** @type {Record<string, () => import("../ports/chart-provider.js").ChartProvider>} */
const chartProviders = {
  "apple-rss": () => createAppleRssChartProvider(),
};

/** @type {Record<string, () => import("../ports/weather-provider.js").WeatherProvider>} */
const weatherProviders = {
  "open-meteo": () => createOpenMeteoWeather(),
};

/** @type {Record<string, () => import("../ports/music-catalog.js").MusicCatalog>} */
const catalogs = {
  itunes: () => createItunesCatalog(),
};

function pick(registry, key, label) {
  const make = registry[key];
  if (!make) throw new ConfigError(`Unknown ${label} "${key}"`);
  return make();
}

/**
 * Build the configured use case. Throws ConfigError (→ 500 with a safe message)
 * if a provider is unknown or required config is missing.
 * @returns {(input: { mood: string, lat?: number, lng?: number }) => Promise<import("../domain/vibe.js").TResolvedVibe>}
 */
export function getVibeService() {
  const interpreterKey = process.env.MOOD_INTERPRETER || "gemini";

  // Build a fallback chain: the selected brain first, then any other configured
  // API brain, then the zero-key rule-based brain last (never fails). So a
  // rate-limited/quota-capped provider degrades to the next instead of erroring.
  const order = [...new Set([interpreterKey, "gemini", "groq", "rule-based"])];
  const chain = [];
  for (const key of order) {
    if (!interpreters[key]) continue;
    if (key === "gemini" && !process.env.GEMINI_API_KEY) continue;
    if (key === "groq" && !process.env.GROQ_API_KEY) continue;
    chain.push(interpreters[key]());
  }
  if (chain.length === 0) chain.push(interpreters["rule-based"]());
  const interpreter = chain.length === 1 ? chain[0] : createFallbackInterpreter({ chain });

  return createVibe({
    interpreter,
    resolver: pick(resolvers, process.env.TRACK_RESOLVER || "itunes", "TRACK_RESOLVER"),
    geocoder: pick(geocoders, process.env.GEOCODER || "nominatim", "GEOCODER"),
    chartProvider: pick(
      chartProviders,
      process.env.CHART_PROVIDER || "apple-rss",
      "CHART_PROVIDER"
    ),
    weatherProvider: pick(
      weatherProviders,
      process.env.WEATHER_PROVIDER || "open-meteo",
      "WEATHER_PROVIDER"
    ),
  });
}

/** The configured music catalog (artist/album browsing). */
export function getCatalog() {
  return pick(catalogs, process.env.MUSIC_CATALOG || "itunes", "MUSIC_CATALOG");
}
