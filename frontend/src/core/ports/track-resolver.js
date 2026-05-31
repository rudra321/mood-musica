// Port: the contract for "resolve a track intent to playable media + links".
// Adapters (iTunes, Deezer, Spotify, ...) implement this shape. An optional
// `country` biases the storefront/region. Implementations must be resilient —
// resolve always returns a ResolvedTrack (resolved:false on a miss or upstream
// failure), so one bad track never fails the whole request.

/**
 * @typedef {object} TrackResolver
 * @property {(intent: import("../domain/vibe.js").TTrackIntent, opts?: { country?: string }) => Promise<import("../domain/vibe.js").TResolvedTrack>} resolve
 */

export {};
