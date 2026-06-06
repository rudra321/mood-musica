// Application use case: geocode → local charts → interpret (candidate pool) →
// resolve every candidate → keep only real/playable, drop already-seen, sample to
// the final count with a per-request seed → assemble. Depends only on port
// contracts (injected); every step degrades gracefully.

import { ResolvedVibe } from "../domain/vibe.js";
import { contrastTextColor, vivify } from "../domain/color.js";
import { FINAL_COUNT } from "../curation/build-prompt.js";

const idOf = (t) => `${t.artist}::${t.title}`;

// Deterministic PRNG (mulberry32) so a given seed reproducibly shuffles.
function seededShuffle(arr, seed) {
  let a = (seed || 1) >>> 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * @param {{
 *   interpreter: import("../ports/mood-interpreter.js").MoodInterpreter,
 *   resolver: import("../ports/track-resolver.js").TrackResolver,
 *   geocoder: import("../ports/geocoder.js").Geocoder,
 *   chartProvider: import("../ports/chart-provider.js").ChartProvider,
 *   weatherProvider: import("../ports/weather-provider.js").WeatherProvider,
 * }} deps
 */
export function createVibe({ interpreter, resolver, geocoder, chartProvider, weatherProvider }) {
  return async function createVibeForMood({ mood, image, lat, lng, eraFrom, eraTo, familiarity, exclude, seed }) {
    const place =
      typeof lat === "number" && typeof lng === "number"
        ? await geocoder.reverseGeocode({ lat, lng })
        : null;

    // Local charts + current conditions, fetched together (best-effort).
    const [chart, weather] = await Promise.all([
      place ? chartProvider.topSongs(place.countryCode) : [],
      place && typeof lat === "number" ? weatherProvider.current({ lat, lng }) : null,
    ]);

    const vibe = await interpreter.interpret({
      mood,
      image,
      place,
      chart,
      weather,
      era: { from: eraFrom ?? null, to: eraTo ?? null },
      familiarity,
      exclude,
      seed,
    });

    // Resolve the whole candidate pool; verification kills hallucinated picks.
    const country = place?.countryCode;
    const all = await Promise.all(
      vibe.tracks.map((t) => resolver.resolve(t, { country }))
    );

    const excludeSet = new Set(exclude || []);
    const fresh = all.filter((t) => !excludeSet.has(idOf(t)));
    const resolved = seededShuffle(fresh.filter((t) => t.resolved), seed);
    const unresolved = seededShuffle(fresh.filter((t) => !t.resolved), (seed || 1) + 1);

    // Prefer real/playable; backfill with unresolved only if too few remain.
    const tracks = resolved.concat(unresolved).slice(0, FINAL_COUNT);

    // Vividness floor so the palette always has life; gradient stays deep.
    const palette = {
      ...vibe.palette,
      colors: vibe.palette.colors.map((c) => vivify(c)),
      gradientFrom: vivify(vibe.palette.gradientFrom, { minS: 0.5, minL: 0.16, maxL: 0.4 }),
      gradientTo: vivify(vibe.palette.gradientTo, { minS: 0.5, minL: 0.2, maxL: 0.48 }),
    };
    const textColor = contrastTextColor(palette.gradientFrom);

    return ResolvedVibe.parse({ ...vibe, palette, tracks, textColor, place, weather });
  };
}
