"use client";

// Sticky glass mini-player (light mode). Appears once something is playing and
// persists across re-searches.

import { AnimatePresence, motion } from "framer-motion";
import { Play, Pause } from "./icons";

export default function NowPlaying({ player }) {
  const t = player.currentTrack;
  const pct = Math.round(player.progress * 100);

  return (
    <AnimatePresence>
      {t && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="fixed inset-x-0 bottom-0 z-20 px-4 pb-4 sm:px-10"
        >
          <div className="glass mx-auto flex max-w-md items-center gap-4 rounded-2xl p-3 shadow-xl shadow-black/15">
            <button
              type="button"
              onClick={() => player.play(t)}
              aria-label={player.playing ? "Pause" : "Play"}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white transition-transform hover:scale-105"
            >
              {player.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-[1px]" />}
            </button>

            {t.artworkUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.artworkUrl} alt="" className="h-11 w-11 flex-shrink-0 rounded-md object-cover ring-1 ring-black/10" />
            ) : null}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#1c1b19]">{t.title}</p>
              <p className="truncate text-xs text-black/50">{t.artist}</p>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-black/10">
                <div className="h-full rounded-full bg-neutral-900/80 transition-[width] duration-200" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <span className="hidden flex-shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-black/35 sm:block">
              preview
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
