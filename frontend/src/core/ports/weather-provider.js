// Port: current local conditions (weather + local hour) at a coordinate, so a
// vibe can reflect "right here, right now". Adapters: Open-Meteo now. Best-effort
// — returns null on failure so a vibe still works without it.

/**
 * @typedef {object} WeatherProvider
 * @property {(coords: { lat: number, lng: number }) => Promise<import("../domain/vibe.js").TWeather | null>} current
 */

export {};
