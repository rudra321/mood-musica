// Shared iTunes helpers used by BOTH the resolver and the catalog adapter, so the
// raw-iTunes → domain mapping lives in exactly one place.

export function spotifySearchUrl(query) {
  return `https://open.spotify.com/search/${encodeURIComponent(query)}`;
}

export function upscaleArtwork(url) {
  return url ? url.replace("100x100bb", "600x600bb") : null;
}

const COVERISH =
  /karaoke|tribute|made famous by|as made famous|originally performed|lullaby version|8-?bit|instrumental version|cover version|piano tribute|string quartet/i;

/** True for obvious cover/karaoke/knockoff results we should skip. */
export function isCoverish(title, artist) {
  return COVERISH.test(`${title ?? ""} ${artist ?? ""}`);
}

/**
 * Map a raw iTunes "track" result to our ResolvedTrack shape (without `why`,
 * which the caller fills in). Used for resolved vibe tracks and catalog browse
 * tracks alike.
 */
export function mapItunesTrack(raw) {
  const query = `${raw.artistName} ${raw.trackName}`;
  return {
    artist: raw.artistName,
    title: raw.trackName,
    why: "",
    resolved: true,
    previewUrl: raw.previewUrl ?? null,
    artworkUrl: upscaleArtwork(raw.artworkUrl100),
    album: raw.collectionName ?? null,
    genre: raw.primaryGenreName ?? null,
    year: raw.releaseDate ? String(raw.releaseDate).slice(0, 4) : null,
    durationMs: raw.trackTimeMillis ?? null,
    artistId: raw.artistId ?? null,
    collectionId: raw.collectionId ?? null,
    links: {
      spotifySearch: spotifySearchUrl(query),
      apple: raw.trackViewUrl ?? null,
      appleArtist: raw.artistViewUrl ?? null,
      appleAlbum: raw.collectionViewUrl ?? null,
    },
  };
}
