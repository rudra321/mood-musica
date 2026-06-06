// Single source of truth for the data contract.
//
// Every shape the app passes around is defined here once, as a Zod schema. The
// schemas validate the LLM's output, validate the HTTP request, shape the wire
// DTO, and (via the JSDoc typedefs below) type the rest of the codebase. Nothing
// here imports React or Next — this module is pure and framework-agnostic.

import { z } from "zod";

/** A 6-digit hex color, normalized to lowercase. */
export const HexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "must be a 6-digit hex color, e.g. #1a2b3c")
  .transform((s) => s.toLowerCase());

/** What the brain proposes for a single song, before resolution. */
export const TrackIntent = z.object({
  artist: z.string().trim().min(1),
  title: z.string().trim().min(1),
  why: z.string().trim().default(""),
});

export const Palette = z.object({
  name: z.string().trim().min(1),
  // Tolerant count so a slightly off LLM response still renders.
  colors: z.array(HexColor).min(3).max(6),
  gradientFrom: HexColor,
  gradientTo: HexColor,
});

export const Mood = z.object({
  label: z.string().trim().default(""),
  subtitle: z.string().trim().default(""),
});

/** How the brain understood the request (surfaced to the user for transparency). */
export const Interpretation = z.object({
  genres: z.array(z.string()).default([]).catch([]),
  era: z.string().nullable().default(null).catch(null),
  energy: z.string().nullable().default(null).catch(null),
  tone: z.string().nullable().default(null).catch(null),
  activity: z.string().nullable().default(null).catch(null),
  language: z.string().nullable().default(null).catch(null),
  keywords: z.array(z.string()).default([]).catch([]),
});

/** The brain's full output: a palette + mood + track intents (a candidate pool). */
export const Vibe = z.object({
  palette: Palette,
  mood: Mood,
  tracks: z.array(TrackIntent).min(1).max(20),
  interpretation: Interpretation.nullable().default(null),
});

export const TrackLinks = z.object({
  spotifySearch: z.string().url(),
  apple: z.string().url().nullable().default(null),
  appleArtist: z.string().url().nullable().default(null),
  appleAlbum: z.string().url().nullable().default(null),
});

/** A track intent after the resolver has attached playable media + metadata. */
export const ResolvedTrack = TrackIntent.extend({
  resolved: z.boolean(),
  previewUrl: z.string().url().nullable(),
  artworkUrl: z.string().url().nullable(),
  album: z.string().nullable().default(null),
  genre: z.string().nullable().default(null),
  year: z.string().nullable().default(null),
  durationMs: z.number().nullable().default(null),
  artistId: z.number().nullable().default(null),
  collectionId: z.number().nullable().default(null),
  links: TrackLinks,
});

/** A resolved geographic place (from reverse-geocoding a map pin). */
export const Place = z.object({
  label: z.string().trim().min(1),
  countryCode: z.string().trim().length(2).toLowerCase(),
  lat: z.number(),
  lng: z.number(),
});

/** Local conditions at the place (weather + local hour) for "right here, right now". */
export const Weather = z.object({
  tempC: z.number().nullable().default(null),
  description: z.string().default(""),
  emoji: z.string().default(""),
  localHour: z.number().int().min(0).max(23).nullable().default(null),
  partOfDay: z.string().default(""),
});

/** The complete payload returned to the client. */
export const ResolvedVibe = Vibe.extend({
  tracks: z.array(ResolvedTrack),
  textColor: HexColor,
  place: Place.nullable().default(null),
  weather: Weather.nullable().default(null),
});

/** The HTTP request body for POST /api/vibe. Mood or a photo required; rest optional. */
export const VibeRequest = z
  .object({
    mood: z.string().trim().max(280, "Keep it under 280 characters.").optional().default(""),
    image: z.string().optional(), // data URL of an uploaded photo (vision input)
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    eraFrom: z.number().int().min(1900).max(2100).optional(),
    eraTo: z.number().int().min(1900).max(2100).optional(),
    familiarity: z.enum(["deep", "balanced", "hits"]).optional(),
    exclude: z.array(z.string()).max(60).optional(),
    seed: z.number().optional(),
  })
  .refine((d) => (d.mood && d.mood.length > 0) || d.image, {
    message: "Tell me your mood or share a photo.",
  });

/** @typedef {z.infer<typeof TrackIntent>} TTrackIntent */
/** @typedef {z.infer<typeof Vibe>} TVibe */
/** @typedef {z.infer<typeof ResolvedTrack>} TResolvedTrack */
/** @typedef {z.infer<typeof ResolvedVibe>} TResolvedVibe */
/** @typedef {z.infer<typeof Place>} TPlace */
/** @typedef {z.infer<typeof Weather>} TWeather */
/** @typedef {{ mood: string, place: TPlace | null, chart: {artist: string, title: string}[], weather?: TWeather | null, image?: string | null }} InterpretContext */
