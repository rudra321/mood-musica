// Adapter: implements the ChartProvider port using Apple's free Marketing Tools
// RSS feed of most-played songs per country storefront. No API key. Best-effort:
// any failure returns [] so the brain still curates from its own knowledge.

import { fetchJson } from "../../shared/fetch-json.js";

const BASE = "https://rss.marketingtools.apple.com/api/v2";

/**
 * @param {{ http?: typeof fetchJson, limit?: number }} [deps]
 * @returns {import("../../ports/chart-provider.js").ChartProvider}
 */
export function createAppleRssChartProvider({ http = fetchJson, limit = 25 } = {}) {
  return {
    async topSongs(countryCode) {
      if (!countryCode) return [];
      try {
        const cc = String(countryCode).toLowerCase();
        const url = `${BASE}/${cc}/music/most-played/${limit}/songs.json`;
        const data = await http(url, { timeoutMs: 8000 });
        const results = Array.isArray(data?.feed?.results) ? data.feed.results : [];
        return results
          .filter((r) => r?.name && r?.artistName)
          .map((r) => ({ artist: r.artistName, title: r.name }));
      } catch {
        return [];
      }
    },
  };
}
