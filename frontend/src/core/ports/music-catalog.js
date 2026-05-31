// Port: browse beyond a single track — fetch an artist's albums + top songs, or
// an album's full tracklist. Adapters: iTunes lookup now. Best-effort: returns
// null on failure so the UI can show a friendly "couldn't load" state.

/**
 * @typedef {object} MusicCatalog
 * @property {(artistId: number) => Promise<{
 *   name: string, appleUrl: string|null,
 *   albums: { id: number, name: string, year: string|null, artworkUrl: string|null, appleUrl: string|null }[],
 *   topSongs: import("../domain/vibe.js").TResolvedTrack[]
 * } | null>} artist
 * @property {(collectionId: number) => Promise<{
 *   name: string, year: string|null, artworkUrl: string|null, appleUrl: string|null,
 *   tracks: import("../domain/vibe.js").TResolvedTrack[]
 * } | null>} album
 */

export {};
