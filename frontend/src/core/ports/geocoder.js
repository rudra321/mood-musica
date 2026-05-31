// Port: turn map coordinates into a place (label + country code). Adapters:
// Nominatim now, a paid geocoder later. Best-effort — returns null on failure
// so a geocoding outage degrades to a global (placeless) vibe.

/**
 * @typedef {object} Geocoder
 * @property {(coords: { lat: number, lng: number }) => Promise<import("../domain/vibe.js").TPlace | null>} reverseGeocode
 */

export {};
