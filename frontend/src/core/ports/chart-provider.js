// Port: "what's currently popular in this country" — used to ground the brain's
// regional picks in real chart data. Adapters: Apple Music RSS now. Best-effort —
// returns [] on failure (the brain still curates from its own knowledge).

/**
 * @typedef {object} ChartProvider
 * @property {(countryCode: string) => Promise<{ artist: string, title: string }[]>} topSongs
 */

export {};
