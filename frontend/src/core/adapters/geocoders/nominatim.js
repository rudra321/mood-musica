// Adapter: implements the Geocoder port using OpenStreetMap's free Nominatim
// reverse-geocoding service. No API key. Per Nominatim's usage policy we send a
// descriptive User-Agent and keep requests light (one per vibe). Best-effort:
// any failure returns null so the request degrades to a global vibe.

import { fetchJson } from "../../shared/fetch-json.js";

const URL = "https://nominatim.openstreetmap.org/reverse";
const UA = "MoodMusica/1.0 (mood-to-music demo)";

function buildLabel(address = {}) {
  const locality =
    address.city || address.town || address.village || address.state || null;
  const country = address.country || null;
  return [locality, country].filter(Boolean).join(", ") || country || "Somewhere";
}

/**
 * @param {{ http?: typeof fetchJson }} [deps]
 * @returns {import("../../ports/geocoder.js").Geocoder}
 */
export function createNominatimGeocoder({ http = fetchJson } = {}) {
  return {
    async reverseGeocode({ lat, lng }) {
      try {
        const url = `${URL}?format=jsonv2&zoom=10&lat=${lat}&lon=${lng}`;
        const data = await http(url, {
          headers: { "User-Agent": UA, "Accept-Language": "en" },
          timeoutMs: 8000,
        });
        const code = data?.address?.country_code;
        if (!code) return null;
        return {
          label: buildLabel(data.address),
          countryCode: String(code).toLowerCase(),
          lat,
          lng,
        };
      } catch {
        return null;
      }
    },
  };
}
