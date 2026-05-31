// Stable identity for a track across the player + rows. Standalone module so
// VibeCard, TrackRow, and MapExplorer can share it without import cycles.
export const trackId = (t) => `${t.artist}::${t.title}`;
