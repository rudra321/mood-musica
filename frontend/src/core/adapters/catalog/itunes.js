// Adapter: implements the MusicCatalog port via Apple's free iTunes `lookup`
// endpoint (no key). Reuses the shared iTunes→track mapper. Best-effort.

import { fetchJson } from "../../shared/fetch-json.js";
import { mapItunesTrack, upscaleArtwork } from "../_itunes-shared.js";

const LOOKUP = "https://itunes.apple.com/lookup";

/**
 * @param {{ http?: typeof fetchJson }} [deps]
 * @returns {import("../../ports/music-catalog.js").MusicCatalog}
 */
export function createItunesCatalog({ http = fetchJson } = {}) {
  return {
    async artist(artistId) {
      if (!artistId) return null;
      try {
        const [albRes, songRes] = await Promise.all([
          http(`${LOOKUP}?id=${artistId}&entity=album&limit=12&sort=recent`, { timeoutMs: 8000 }),
          http(`${LOOKUP}?id=${artistId}&entity=song&limit=10`, { timeoutMs: 8000 }),
        ]);
        const aRows = Array.isArray(albRes?.results) ? albRes.results : [];
        const artistRow = aRows.find((r) => r.wrapperType === "artist") || {};
        const albums = aRows
          .filter((r) => r.wrapperType === "collection")
          .map((r) => ({
            id: r.collectionId,
            name: r.collectionName,
            year: r.releaseDate ? String(r.releaseDate).slice(0, 4) : null,
            artworkUrl: upscaleArtwork(r.artworkUrl100),
            appleUrl: r.collectionViewUrl ?? null,
          }));
        const sRows = Array.isArray(songRes?.results) ? songRes.results : [];
        const topSongs = sRows.filter((r) => r.wrapperType === "track").map(mapItunesTrack);
        return {
          name: artistRow.artistName ?? topSongs[0]?.artist ?? "Artist",
          appleUrl: artistRow.artistLinkUrl ?? null,
          albums,
          topSongs,
        };
      } catch {
        return null;
      }
    },

    async album(collectionId) {
      if (!collectionId) return null;
      try {
        const res = await http(`${LOOKUP}?id=${collectionId}&entity=song&limit=40`, { timeoutMs: 8000 });
        const rows = Array.isArray(res?.results) ? res.results : [];
        const col = rows.find((r) => r.wrapperType === "collection") || {};
        const tracks = rows.filter((r) => r.wrapperType === "track").map(mapItunesTrack);
        return {
          name: col.collectionName ?? tracks[0]?.album ?? "Album",
          year: col.releaseDate ? String(col.releaseDate).slice(0, 4) : null,
          artworkUrl: upscaleArtwork(col.artworkUrl100),
          appleUrl: col.collectionViewUrl ?? null,
          tracks,
        };
      } catch {
        return null;
      }
    },
  };
}
