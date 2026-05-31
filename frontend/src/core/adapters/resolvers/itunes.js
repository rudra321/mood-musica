// Adapter: implements the TrackResolver port using Apple's iTunes Search API.
// No auth, 30-second preview + artwork + rich metadata, immune to Spotify's
// API lock-downs. Server-side (iTunes isn't CORS-friendly).
//
// Resilient by contract: never throws. A miss or upstream failure yields an
// unresolved track that still carries a Spotify-search link, so the UI degrades
// gracefully. Fetches a few candidates and skips obvious cover/karaoke versions
// so the surfaced album/artist metadata is the real one.

import { fetchJson } from "../../shared/fetch-json.js";
import { mapItunesTrack, spotifySearchUrl, isCoverish } from "../_itunes-shared.js";

const SEARCH_URL = "https://itunes.apple.com/search";

/**
 * @param {{ http?: typeof fetchJson }} [deps]
 * @returns {import("../../ports/track-resolver.js").TrackResolver}
 */
export function createItunesResolver({ http = fetchJson } = {}) {
  return {
    async resolve(intent, { country } = {}) {
      const query = `${intent.artist} ${intent.title}`.trim();
      /** @type {import("../../domain/vibe.js").TResolvedTrack} */
      const unresolved = {
        ...intent,
        resolved: false,
        previewUrl: null,
        artworkUrl: null,
        album: null,
        genre: null,
        year: null,
        durationMs: null,
        artistId: null,
        collectionId: null,
        links: { spotifySearch: spotifySearchUrl(query), apple: null, appleArtist: null, appleAlbum: null },
      };

      try {
        const storefront = country ? `&country=${encodeURIComponent(country)}` : "";
        const url = `${SEARCH_URL}?term=${encodeURIComponent(query)}&entity=song&limit=3${storefront}`;
        const data = await http(url, { timeoutMs: 8000 });
        const results = Array.isArray(data?.results) ? data.results : [];
        if (!results.length) return unresolved;

        const pick = results.find((r) => !isCoverish(r.trackName, r.artistName)) ?? results[0];
        return { ...mapItunesTrack(pick), why: intent.why ?? "" };
      } catch {
        return unresolved;
      }
    },
  };
}
