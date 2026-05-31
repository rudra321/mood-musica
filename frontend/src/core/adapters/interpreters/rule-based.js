// Adapter: implements the MoodInterpreter port with zero external dependencies —
// no API, no key, no network. Deterministic keyword/sentiment matching maps the
// mood to a curated profile (palette + a pool of real, resolvable songs).
//
// This is the "works with no signup" fallback. Lower variety than an LLM by
// design, but always available and fully offline. Select it with
// MOOD_INTERPRETER=rule-based.

import { Vibe } from "../../domain/vibe.js";

/**
 * @typedef {object} Profile
 * @property {string[]} keywords
 * @property {{ name: string, colors: string[], gradientFrom: string, gradientTo: string }} palette
 * @property {{ label: string, subtitle: string }} mood
 * @property {{ artist: string, title: string, why: string }[]} tracks
 */

/** @type {Profile[]} */
const PROFILES = [
  {
    keywords: ["sad", "melancholy", "rainy", "lonely", "blue", "down", "heartbreak", "cry", "grief", "somber", "miss"],
    palette: { name: "Rain on Glass", colors: ["#1f2a36", "#3a4d5c", "#5b7282", "#8fa6b3", "#c2d1d9"], gradientFrom: "#1b2631", gradientTo: "#3a4d5c" },
    mood: { label: "Quietly heavy", subtitle: "for the grey hours that ask to be felt" },
    tracks: [
      { artist: "Bon Iver", title: "Skinny Love", why: "aching restraint for a heavy heart" },
      { artist: "Radiohead", title: "Fake Plastic Trees", why: "a slow-burning sadness" },
      { artist: "Sufjan Stevens", title: "Mystery of Love", why: "tender and wistful" },
      { artist: "The National", title: "I Need My Girl", why: "quiet longing" },
      { artist: "Jeff Buckley", title: "Hallelujah", why: "cathartic ache" },
      { artist: "Phoebe Bridgers", title: "Motion Sickness", why: "bittersweet clarity" },
      { artist: "Nick Drake", title: "Pink Moon", why: "fragile and grey" },
      { artist: "Daughter", title: "Youth", why: "wistful and worn" },
    ],
  },
  {
    keywords: ["happy", "joy", "joyful", "upbeat", "sunny", "excited", "great", "celebrate", "cheerful", "good mood", "elated"],
    palette: { name: "Sunlit Citrus", colors: ["#7a3b00", "#c9690a", "#f59e0b", "#fcd34d", "#fff3c4"], gradientFrom: "#7a3b00", gradientTo: "#c9690a" },
    mood: { label: "Bright and buoyant", subtitle: "sunshine you can hear" },
    tracks: [
      { artist: "Stevie Wonder", title: "Sir Duke", why: "pure sunshine" },
      { artist: "Earth, Wind & Fire", title: "September", why: "instant grin" },
      { artist: "Pharrell Williams", title: "Happy", why: "literally" },
      { artist: "Lizzo", title: "Good as Hell", why: "a confidence boost" },
      { artist: "Katrina & The Waves", title: "Walking on Sunshine", why: "uncontainable" },
      { artist: "Mark Ronson", title: "Uptown Funk", why: "strut energy" },
      { artist: "Jackson 5", title: "I Want You Back", why: "bouncy joy" },
      { artist: "Whitney Houston", title: "I Wanna Dance with Somebody", why: "euphoric" },
    ],
  },
  {
    keywords: ["calm", "chill", "relax", "peaceful", "mellow", "serene", "quiet", "soothing", "gentle", "unwind", "lazy"],
    palette: { name: "Still Water", colors: ["#0f2e2b", "#1d4e49", "#2f7d74", "#74b3a8", "#bfe0d8"], gradientFrom: "#0f2e2b", gradientTo: "#1d4e49" },
    mood: { label: "Settled and soft", subtitle: "a slow exhale in sound" },
    tracks: [
      { artist: "Bill Evans", title: "Peace Piece", why: "weightless calm" },
      { artist: "Brian Eno", title: "An Ending (Ascent)", why: "floating" },
      { artist: "Nils Frahm", title: "Says", why: "a slow bloom" },
      { artist: "Khruangbin", title: "Maria También", why: "easy groove" },
      { artist: "Bonobo", title: "Kerala", why: "gentle motion" },
      { artist: "Cigarettes After Sex", title: "Apocalypse", why: "soft haze" },
      { artist: "Erik Satie", title: "Gymnopédie No. 1", why: "quiet space" },
      { artist: "José González", title: "Heartbeats", why: "warm stillness" },
    ],
  },
  {
    keywords: ["energetic", "hype", "workout", "gym", "pumped", "party", "dance", "run", "power", "adrenaline", "amped"],
    palette: { name: "Neon Pulse", colors: ["#3a0010", "#7a0626", "#c11042", "#f43f6b", "#ff9bb3"], gradientFrom: "#3a0010", gradientTo: "#7a0626" },
    mood: { label: "Charged up", subtitle: "momentum with a pulse" },
    tracks: [
      { artist: "The Prodigy", title: "Breathe", why: "raw adrenaline" },
      { artist: "Daft Punk", title: "Harder, Better, Faster, Stronger", why: "machine drive" },
      { artist: "Kanye West", title: "Stronger", why: "push harder" },
      { artist: "The Chemical Brothers", title: "Galvanize", why: "relentless" },
      { artist: "Queen", title: "Don't Stop Me Now", why: "full throttle" },
      { artist: "Justice", title: "Genesis", why: "an electric surge" },
      { artist: "LCD Soundsystem", title: "Dance Yrself Clean", why: "build and explode" },
      { artist: "Run the Jewels", title: "Legend Has It", why: "swagger" },
    ],
  },
  {
    keywords: ["love", "romantic", "romance", "crush", "cozy", "intimate", "tender", "sweetheart", "valentine", "date"],
    palette: { name: "Velvet Dusk", colors: ["#2a1230", "#4d1f54", "#7e3b86", "#b06fb6", "#e3b9e6"], gradientFrom: "#2a1230", gradientTo: "#4d1f54" },
    mood: { label: "Warm and close", subtitle: "songs that lean in" },
    tracks: [
      { artist: "Al Green", title: "Let's Stay Together", why: "slow warmth" },
      { artist: "Etta James", title: "At Last", why: "swooning" },
      { artist: "Frank Ocean", title: "Thinkin Bout You", why: "dreamy longing" },
      { artist: "Marvin Gaye", title: "Let's Get It On", why: "smooth" },
      { artist: "Sade", title: "No Ordinary Love", why: "deep devotion" },
      { artist: "The Temptations", title: "My Girl", why: "sunny affection" },
      { artist: "D'Angelo", title: "Untitled (How Does It Feel)", why: "intimate" },
      { artist: "Roberta Flack", title: "The First Time Ever I Saw Your Face", why: "tender awe" },
    ],
  },
  {
    keywords: ["focus", "study", "work", "concentrate", "deep", "productive", "coding", "reading", "flow", "writing"],
    palette: { name: "Deep Work", colors: ["#0b1733", "#16264f", "#27407e", "#5a76c2", "#a9bce6"], gradientFrom: "#0b1733", gradientTo: "#16264f" },
    mood: { label: "In the flow", subtitle: "steady fuel for deep work" },
    tracks: [
      { artist: "Tycho", title: "Awake", why: "steady momentum" },
      { artist: "Boards of Canada", title: "Roygbiv", why: "hypnotic focus" },
      { artist: "Aphex Twin", title: "Avril 14th", why: "calm clarity" },
      { artist: "Ólafur Arnalds", title: "Near Light", why: "a gentle drive" },
      { artist: "Floating Points", title: "Silhouettes", why: "flowing" },
      { artist: "Jon Hopkins", title: "Open Eye Signal", why: "locked-in groove" },
      { artist: "Four Tet", title: "Two Thousand and Seventeen", why: "warm minimal" },
      { artist: "GoGo Penguin", title: "Hopopono", why: "rhythmic focus" },
    ],
  },
];

/** Used when nothing else matches. */
/** @type {Profile} */
const DEFAULT_PROFILE = {
  keywords: [],
  palette: { name: "Faded Polaroid", colors: ["#2e2114", "#5a4123", "#8a6a3a", "#c2a06a", "#e8d2a6"], gradientFrom: "#2e2114", gradientTo: "#5a4123" },
  mood: { label: "Soft and nostalgic", subtitle: "a warm look backward" },
  tracks: [
    { artist: "Fleetwood Mac", title: "Dreams", why: "timeless drift" },
    { artist: "Simon & Garfunkel", title: "The Boxer", why: "a warm memory" },
    { artist: "The Beatles", title: "Here Comes the Sun", why: "gentle hope" },
    { artist: "Stevie Nicks", title: "Edge of Seventeen", why: "wistful" },
    { artist: "Tom Petty", title: "Free Fallin'", why: "open road" },
    { artist: "Bill Withers", title: "Ain't No Sunshine", why: "soulful ache" },
    { artist: "Otis Redding", title: "(Sittin' On) the Dock of the Bay", why: "easy reflection" },
    { artist: "Carole King", title: "So Far Away", why: "tender distance" },
  ],
};

function pickProfile(text) {
  let best = DEFAULT_PROFILE;
  let bestScore = 0;
  for (const profile of PROFILES) {
    const score = profile.keywords.reduce((n, k) => (text.includes(k) ? n + 1 : n), 0);
    if (score > bestScore) {
      best = profile;
      bestScore = score;
    }
  }
  return best;
}

// Deterministic FNV-1a hash — gives stable per-mood variety without randomness.
function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function rotate(arr, n) {
  if (arr.length === 0) return arr;
  const i = n % arr.length;
  return arr.slice(i).concat(arr.slice(0, i));
}

/**
 * @returns {import("../../ports/mood-interpreter.js").MoodInterpreter}
 */
export function createRuleBasedInterpreter() {
  return {
    async interpret({ mood, place }) {
      const profile = pickProfile(mood.toLowerCase());
      const tracks = rotate(profile.tracks, hashString(mood)).slice(0, 8);
      // The offline fallback can't curate by region; it just acknowledges the
      // place in the subtitle so the UI stays coherent.
      const subtitle = place
        ? `${profile.mood.subtitle} · from ${place.label}`
        : profile.mood.subtitle;
      // Parse against the same schema the LLM output goes through — guarantees
      // this adapter can never emit a shape the rest of the app can't handle.
      return Vibe.parse({
        palette: profile.palette,
        mood: { ...profile.mood, subtitle },
        tracks,
      });
    },
  };
}
