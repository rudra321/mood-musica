# MoodMusica — "Color of the Feeling" · UI/UX Design Brief

> Self-authored implementation prompt. Researched against 2026 award-gallery
> patterns: cinematic dark mode, *mature* glassmorphism (subtle, not heavy-blur),
> soft film grain for depth/humanity, neo-serif display + monospace metadata,
> GPU-friendly animated color, emotive & immersive over decorative.

## North star
The app's whole idea is "the color of a feeling." So **the generated color is the
interface** — not a swatch on a card, but the light the whole room is lit by. A
user should describe a mood and watch the screen *become* that mood, then hand
them a soundtrack inside it. It should feel like a late-night listening room, not
a form.

## Principles
1. **Color is the hero.** The palette drives a living, full-screen aurora behind
   everything. Before a result: a muted neutral aurora. After: it morphs to the
   vibe's colors over ~1.4s.
2. **Calm, cinematic dark.** Near-black canvas (`#070708`), luminous accents,
   high but balanced contrast. No pure-black, no flat gray cards.
3. **Mature glass, not 2020 glass.** Translucent panels = `rgba(255,255,255,.045)`
   + `backdrop-blur` + 1px white/10 border + soft shadow. Subtle. Depth, not noise.
4. **Texture = humanity.** A fixed, low-opacity SVG film-grain overlay (~5%) over
   the whole viewport, `mix-blend: overlay`. Kills the "rendered HTML" sterility.
5. **Type with a voice.** Display = **Fraunces** (variable neo-serif, optical
   sizing, a little italic) for the palette name + hero. UI/body = **Geist Sans**
   (already self-hosted). Metadata (track #, hex codes, tags) = **Geist Mono**.
   This is the 2026 "neo-serif headline + mono utility" pairing.
6. **Motion with intent.** Framer Motion: hero/result crossfade, staggered track
   reveal (~60ms), spring hovers. Aurora drifts slowly (GPU transforms, 60fps).
   Honor `prefers-reduced-motion`.
7. **It's a music app.** One global audio engine → only one preview plays at a
   time, with a sticky glass **now-playing** bar (art, title, live progress,
   pause). Play buttons live on the artwork with a fill/progress treatment.
8. **Anti-slop.** No Inter/Roboto, no purple-on-white gradient cliché, no generic
   card grid. Distinctive serif, color sourced from the user's own vibe.

## Flow & states (single immersive screen)
- **Idle / hero:** mono eyebrow ("WHAT'S THE COLOR OF YOUR FEELING?"), a large
  Fraunces line, a glass input with an inline send affordance, and a row of
  tappable example-mood chips ("rainy sunday", "3am and can't sleep", "summer
  road trip", "heartbroken but free", "deep focus", "golden hour").
- **Loading:** input calms/disables; aurora gently intensifies; a cycling mono
  status line ("Listening…" → "Mixing the colors…" → "Cueing the songs…").
- **Result:** hero recedes; the aurora has become the vibe. A compact input stays
  at top for the next mood. The result reads top-to-bottom:
  - Huge **Fraunces** palette name; mood label; italic subtitle.
  - Palette as elegant chips; hex code in mono appears on hover.
  - **Tracklist**: mono index · artwork (with play overlay + progress ring) ·
    title (Geist medium) · artist (muted) · italic "why" · subtle Spotify/iTunes
    out-links. Rows reveal in a stagger.
- **Now playing:** sticky bottom glass bar; persists across re-searches.

## Component map (presentation only — `core/` is untouched)
- `app/layout.js` — dark shell, Fraunces `<link>`, fixed grain, slim wordmark header (kill the blue bar/footer).
- `app/globals.css` — theme tokens, `.aurora` + drift keyframes, `.grain`, `.glass`, reduced-motion.
- `app/components/Aurora.jsx` — 5 blurred drifting color blobs from the palette; `background-color` transitions on change.
- `app/components/VibeStudio.jsx` — the client experience: request lifecycle + the global audio engine + CSS-var palette wiring.
- `app/components/MoodInput.jsx` — glass input + example chips.
- `app/components/VibeCard.jsx` — immersive result (name, swatches, tracklist).
- `app/components/TrackRow.jsx` — one track; play overlay + progress; out-links.
- `app/components/NowPlaying.jsx` — sticky glass mini-player.
- `tailwind.config.js` — `display`/`sans`/`mono` font families.

## Technical guardrails
- Aurora blobs are **solid `background-color` + heavy blur** (so color changes
  tween smoothly) animated only via `transform` (GPU). No layout thrash.
- One `Audio` element lifted to `VibeStudio`; children get `{ currentId, playing,
  progress, currentTrack, play() }`. Never N audio tags.
- All color values flow from the validated `ResolvedVibe` (already sanitized hex
  + server-derived `textColor`). No new color logic in the UI.
- `prefers-reduced-motion`: freeze aurora + skip entrance animations.
- One dependency added: `framer-motion`.

## Acceptance
Build clean; a real mood morphs the whole screen to its palette; tracks reveal in
a stagger; exactly one preview plays at a time with a working progress bar; looks
like a product, not a document.
