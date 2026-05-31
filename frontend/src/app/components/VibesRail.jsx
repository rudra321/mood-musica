"use client";

// Slim frosted-glass rail docked on the right: the places you've explored this
// session (newest first), each a color dot + palette name + place/mood. Click to
// replay. Desktop only — on mobile the map blooms serve the same purpose.

import { AnimatePresence, motion } from "framer-motion";
import { cityOf } from "./format";

export default function VibesRail({ explored, onSelect }) {
  return (
    <AnimatePresence>
      {explored.length > 0 && (
        <motion.aside
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 32 }}
          className="glass absolute right-0 top-0 z-20 hidden h-full w-60 flex-col overflow-y-auto p-4 pb-28 pt-20 md:flex"
        >
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-black/45">
            your vibes
          </p>
          <ul className="space-y-1">
            {[...explored].reverse().map((e, i) => (
              <li key={`${e.coords.lat},${e.coords.lng},${i}`}>
                <button
                  type="button"
                  onClick={() => onSelect(e)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-black/[0.06]"
                >
                  <span
                    className="h-3 w-3 flex-shrink-0 rounded-full ring-1 ring-black/10"
                    style={{ background: e.accent || "#999" }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-[#1c1b19]">
                      {e.vibe?.palette?.name || "Vibe"}
                    </span>
                    <span className="block truncate text-[11px] text-black/45">
                      {cityOf(e.vibe?.place?.label) || e.mood}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
