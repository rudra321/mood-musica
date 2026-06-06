"use client";

// A musical road trip: each stop's vibe, in order, as one journey you play
// through. Gradient header blends the first stop's start color into the last
// stop's end color.

import { motion } from "framer-motion";
import { flagOf, cityOf } from "./format";
import { trackId } from "./player-utils";
import TrackRow from "./TrackRow";

export default function TripCard({ trip, player, onOpenDetail }) {
  const route = trip.map((s) => cityOf(s.vibe?.place?.label) || "somewhere").join("  →  ");
  const gradFrom = trip[0]?.vibe?.palette?.gradientFrom || "#2a2440";
  const gradTo = trip[trip.length - 1]?.vibe?.palette?.gradientTo || "#4a3a6a";
  const band = `linear-gradient(135deg, ${gradFrom}, ${gradTo})`;
  const tc = trip[0]?.vibe?.textColor || "#ffffff";

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="overflow-hidden rounded-3xl ring-1 ring-black/10"
      style={{ boxShadow: `0 24px 60px -28px ${gradTo}99` }}
    >
      <header className="p-6" style={{ background: band, color: tc }}>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ opacity: 0.72 }}>
          🧭 road trip · {trip.length} stops
        </p>
        <h2 className="mt-2 font-display text-[24px] leading-[1.15]">{route}</h2>
      </header>

      <div>
        {trip.map((s, si) => {
          const pal = s.vibe.palette;
          const accent = pal.colors[0];
          const flag = flagOf(s.vibe?.place?.countryCode);
          const city = cityOf(s.vibe?.place?.label);
          return (
            <div key={si}>
              <div className="flex items-center gap-2 border-y border-black/[0.06] bg-black/[0.03] px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-black/55">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[10px] text-white">
                  {si + 1}
                </span>
                {flag} {city || "somewhere"}
              </div>
              <ol className="divide-y divide-black/[0.06]">
                {s.vibe.tracks.slice(0, 4).map((t, i) => (
                  <li key={`${si}-${trackId(t)}-${i}`}>
                    <TrackRow track={t} index={i} player={player} palette={pal} accent={accent} onOpenDetail={onOpenDetail} />
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
    </motion.article>
  );
}
