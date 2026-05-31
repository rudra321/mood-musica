# MoodMusica

**Describe a feeling, tap a place on the map, and get an AI-curated color palette
+ a region-appropriate, playable soundtrack.**

A map-first music-discovery web app. The whole screen is an interactive world map;
type a mood, drop a pin anywhere, and the screen blooms into that place's sound —
a named gradient palette and a tracklist of real songs from that region, in that
mood, with 30-second previews you can play inline.

> Lagos + "energetic night out" → Afrobeats. Jaipur + "folk" → Rajasthani folk
> (Manganiyar/Langa). Lisbon + "melancholy" → fado-tinged. Paris + "folk" → chanson.

---

## Features

- 🗺️ **Map-first explorer** — full-screen Leaflet map; tap any place (or *Surprise me*) to hear it. Explored places bloom on the map in their palette color and collect in a "Your vibes" rail to replay.
- 🎨 **Color of the feeling** — every result is a vivid named palette; the card is the hero artifact.
- 🌍 **Region + mood aware** — songs are local to the place *and* fit the mood, grounded in real per-country charts. Defaults to the place's language (English only if you ask).
- 🧠 **Two-stage AI** — your free text is parsed into a structured brief, then curated; the interpretation ("heard as …") is shown for transparency.
- 🎚️ **Tunable** — an era range (new ↔ classic) + adventurousness (deep cuts ↔ hits). Anti-canon by default, so you don't get the same famous 10 every time.
- ▶️ **Playable** — one global player, 30-second iTunes previews, a sticky now-playing bar, plus an in-app **artist / album / track browser** (drill around with a back stack).
- 🪟 **Light, glassmorphic UI** — frosted glass over the map, a coherent SVG icon set, framer-motion throughout.
- 🔌 **No vendor lock-in** — every capability is a swappable provider chosen by an env var. A zero-key offline fallback brain is included.

---

## How it works

```
mood + map pin
   │
   ▼
geocode (Nominatim) ─► place + country
   │
   ▼
local charts (Apple RSS) ─┐
   │                      ▼
   └────────► AI interpreter (Gemini / Groq, two-stage parse → curate)
                          │  candidate tracklist + palette
                          ▼
              resolve every track (iTunes) — verify it's real, drop fakes
                          │
                          ▼
              palette + 8 playable tracks  ─►  the vibe card
```

Playback is 30-second previews (no Spotify auth needed); tracks also link out.

---

## Architecture

Ports & Adapters (hexagonal). `core/` is framework-agnostic; `app/` is the Next.js
route + React UI. Providers are wired in one composition root and selected by env
var, so swapping the AI, the resolver, the geocoder, etc. never touches the rest.

```
frontend/src/
  core/                         # framework-agnostic
    domain/      vibe.js (Zod = single source of truth) · color.js · errors.js
    ports/       mood-interpreter · track-resolver · geocoder · chart-provider · music-catalog
    services/    create-vibe.js          # interpret → resolve → verify → assemble
    curation/    instructions.js · build-prompt.js   # the prompt policy (provider-agnostic)
    adapters/
      interpreters/  openai-compatible.js (Gemini/Groq) · rule-based.js (zero-key)
      resolvers/     itunes.js
      geocoders/     nominatim.js
      charts/        apple-rss.js
      catalog/       itunes.js
    config/      providers.js            # composition root (env → adapters)
  app/
    api/vibe · api/catalog               # thin route handlers
    components/  MapExplorer · MapCanvas · VibeCard · TrackRow · NowPlaying
                 DetailModal · VibesRail · Tuner · icons.jsx · …
```

---

## Tech stack

Next.js 14 (App Router) · React 18 · Tailwind CSS · Zod · Framer Motion ·
Leaflet / react-leaflet. AI via OpenAI-compatible endpoints (Google Gemini /
Groq). Music data via Apple's free **iTunes Search/Lookup** + **Marketing Tools
RSS**; geocoding via **OpenStreetMap Nominatim**; map tiles via **CARTO**. No paid
services, no credit card required.

---

## Getting started

```bash
cd frontend
npm install
cp .env.local.example .env.local   # then add a key (see below)
npm run dev                        # http://localhost:3000
```

### Environment (`frontend/.env.local`)

```bash
# Pick a brain (default: gemini). Each is free, no credit card.
MOOD_INTERPRETER=gemini
GEMINI_API_KEY=        # https://aistudio.google.com/apikey
# or:
# MOOD_INTERPRETER=groq
# GROQ_API_KEY=        # https://console.groq.com/keys
# or run with no key at all:
# MOOD_INTERPRETER=rule-based
```

Optional overrides: `GEMINI_MODEL`, `GROQ_MODEL`, `TRACK_RESOLVER` (itunes),
`GEOCODER` (nominatim), `CHART_PROVIDER` (apple-rss), `MUSIC_CATALOG` (itunes).
`.env.local` is gitignored — never commit your keys.

### Swapping a provider

Every brain/resolver/geocoder/catalog is registered in `core/config/providers.js`.
To add one (e.g. another LLM), write an adapter implementing the port, add one line
to the registry, and set the env var. Gemini, Groq, and OpenAI-style endpoints all
share one generic `openai-compatible` adapter.

---

## Notes & caveats

- **Free-tier limits.** Gemini/Groq free tiers have daily/rate limits; the brain
  auto-falls-back to a lighter model on a rate-limit, and there's a zero-key
  `rule-based` fallback.
- **AI "from that area"** is a strong cultural best-guess for major scenes (charts
  ground it); tiny local scenes are fuzzier.
- **Previews are 30 seconds** (iTunes); the full song opens via the out-links.
- **Attribution:** map © OpenStreetMap & CARTO; music data © Apple.

---

*An experiment in turning a feeling — and a place — into color and sound.*
