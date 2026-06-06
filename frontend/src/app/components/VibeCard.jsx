"use client";

// Result card. The vivid gradient header (with a contrast-correct text color)
// carries region identity + vibe meters; the tracklist sits below on a light
// surface. Light mode.

import { useState } from "react";
import { motion } from "framer-motion";
import { trackId } from "./player-utils";
import { flagOf, cityOf, energyLevel } from "./format";
import { Share } from "./icons";
import TrackRow from "./TrackRow";

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const fmtHour = (h) => (h == null ? null : `${((h + 11) % 12) + 1}${h < 12 ? "am" : "pm"}`);

export default function VibeCard({ vibe, player, onOpenDetail }) {
  const { palette, mood, tracks, textColor, interpretation, place, weather } = vibe;
  const band = `linear-gradient(135deg, ${palette.gradientFrom}, ${palette.gradientTo})`;
  const accent = palette.colors[2] || palette.colors[0] || palette.gradientFrom;

  const city = place ? cityOf(place.label) : null;
  const flag = place ? flagOf(place.countryCode) : "";

  const [shared, setShared] = useState(false);
  function shareCardUrl() {
    const d = {
      n: palette.name,
      gf: palette.gradientFrom,
      gt: palette.gradientTo,
      tc: textColor,
      co: palette.colors,
      pl: city,
      fl: flag,
      ms: mood.subtitle || "",
      tr: tracks.slice(0, 6).map((t) => [t.title, t.artist]),
    };
    return `${window.location.origin}/api/og?d=${encodeURIComponent(JSON.stringify(d))}`;
  }
  async function onShare() {
    const url = shareCardUrl();
    try {
      if (navigator.share) {
        await navigator.share({ title: palette.name, text: "the sound of a feeling", url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 1600);
      }
    } catch {
      /* user dismissed share sheet */
    }
  }
  const lvl = energyLevel(interpretation?.energy);
  const era = interpretation?.era;
  const topGenre = (interpretation?.genres || [])[0];

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="overflow-hidden rounded-3xl ring-1 ring-black/10"
      style={{ boxShadow: `0 24px 60px -28px ${accent}99` }}
    >
      <header className="relative overflow-hidden p-6" style={{ background: band, color: textColor }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(120% 90% at 0% 0%, rgba(255,255,255,0.20), transparent 55%)" }} />
        <div className="pointer-events-none absolute inset-0 opacity-[0.09]" style={{ backgroundImage: GRAIN }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/35" />

        <button
          type="button"
          onClick={onShare}
          aria-label="Share this vibe"
          className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wide transition-opacity hover:opacity-100"
          style={{ background: "rgba(255,255,255,0.18)", color: textColor, opacity: 0.85 }}
        >
          <Share className="h-3.5 w-3.5" /> {shared ? "copied" : "share"}
        </button>

        <div className="relative">
          <p className="font-display text-sm italic" style={{ opacity: 0.85 }}>
            {city ? `${flag} the sound of ${city}` : mood.label || "your vibe"}
          </p>
          {weather && (weather.emoji || weather.tempC != null) && (
            <p className="mt-1 font-mono text-[11px]" style={{ opacity: 0.72 }}>
              {[weather.emoji, weather.description, weather.tempC != null && `${weather.tempC}°`, fmtHour(weather.localHour)]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          <h2 className="mt-1.5 font-display text-[30px] font-medium leading-[1.04] tracking-[-0.01em]">
            {palette.name}
          </h2>
          {mood.subtitle && (
            <p className="mt-1 text-sm" style={{ opacity: 0.78 }}>
              {mood.subtitle}
            </p>
          )}

          {/* vibe meters — a visual read of what it understood */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ opacity: 0.6 }}>energy</span>
              <span className="flex gap-0.5">
                {[1, 2, 3].map((n) => (
                  <span key={n} className="h-3 w-1.5 rounded-sm" style={{ background: "currentColor", opacity: n <= lvl ? 0.95 : 0.28 }} />
                ))}
              </span>
            </span>
            {era && (
              <span className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ opacity: 0.7 }}>{era}</span>
            )}
            {topGenre && (
              <span className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ opacity: 0.7 }}>{topGenre}</span>
            )}
          </div>

          <div className="mt-4 flex h-2.5 overflow-hidden rounded-full ring-1 ring-white/30">
            {palette.colors.map((c, i) => (
              <span key={i} className="flex-1" style={{ background: c }} />
            ))}
          </div>
        </div>
      </header>

      <ol className="divide-y divide-black/[0.06]" style={{ background: "transparent" }}>
        {tracks.map((track, i) => (
          <motion.li
            key={`${trackId(track)}-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 + i * 0.04, duration: 0.3 }}
          >
            <TrackRow track={track} index={i} player={player} palette={palette} accent={accent} onOpenDetail={onOpenDetail} />
          </motion.li>
        ))}
      </ol>
    </motion.article>
  );
}
