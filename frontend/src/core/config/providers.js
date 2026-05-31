// Composition root: the ONLY place that knows which concrete adapters are active.
// Providers are selected by env var and looked up in registries. Swapping or
// adding a provider = one registry line + an env var. The service, the route,
// and the UI never reference a concrete provider.

import { createOpenAICompatibleInterpreter } from "../adapters/interpreters/openai-compatible.js";
import { createRuleBasedInterpreter } from "../adapters/interpreters/rule-based.js";
import { createItunesResolver } from "../adapters/resolvers/itunes.js";
import { createNominatimGeocoder } from "../adapters/geocoders/nominatim.js";
import { createAppleRssChartProvider } from "../adapters/charts/apple-rss.js";
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

/** Which env var holds the API key for each interpreter (for a clear error). */
const interpreterKeyEnv = { groq: "GROQ_API_KEY", gemini: "GEMINI_API_KEY" };

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
  const interpreterKey = process.env.MOOD_INTERPRETER || "groq";

  const needEnv = interpreterKeyEnv[interpreterKey];
  if (needEnv && !process.env[needEnv]) {
    throw new ConfigError(`${needEnv} is not set. Add it to frontend/.env.local.`);
  }

  return createVibe({
    interpreter: pick(interpreters, interpreterKey, "MOOD_INTERPRETER"),
    resolver: pick(resolvers, process.env.TRACK_RESOLVER || "itunes", "TRACK_RESOLVER"),
    geocoder: pick(geocoders, process.env.GEOCODER || "nominatim", "GEOCODER"),
    chartProvider: pick(
      chartProviders,
      process.env.CHART_PROVIDER || "apple-rss",
      "CHART_PROVIDER"
    ),
  });
}

/** The configured music catalog (artist/album browsing). */
export function getCatalog() {
  return pick(catalogs, process.env.MUSIC_CATALOG || "itunes", "MUSIC_CATALOG");
}
