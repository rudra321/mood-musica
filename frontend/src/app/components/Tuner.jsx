"use client";

// Tuning controls (light mode): a "new <-> classic" era range and an
// adventurousness segmented control. Presentational — state lives in the parent.

export const ERA_MIN = 1950;
export const ERA_MAX = 2025;

const LEVELS = [
  ["deep", "Deep cuts"],
  ["balanced", "Balanced"],
  ["hits", "Hits"],
];

export default function Tuner({ era, setEra, familiarity, setFamiliarity }) {
  const from = era.from ?? ERA_MIN;
  const to = era.to ?? ERA_MAX;
  const fmt = (y) => (y >= ERA_MAX ? "now" : String(y));

  return (
    <div className="glass mt-2 rounded-2xl p-4 shadow-xl shadow-black/10">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-black/50">era</span>
        <span className="font-mono text-[11px] text-black/75">
          {fmt(from)} — {fmt(to)}
        </span>
      </div>
      <div className="mt-2 space-y-2">
        <input
          type="range"
          min={ERA_MIN}
          max={ERA_MAX}
          step={5}
          value={from}
          aria-label="Era from"
          onChange={(e) => setEra({ from: Math.min(+e.target.value, to), to })}
          className="w-full accent-neutral-900"
        />
        <input
          type="range"
          min={ERA_MIN}
          max={ERA_MAX}
          step={5}
          value={to}
          aria-label="Era to"
          onChange={(e) => setEra({ from, to: Math.max(+e.target.value, from) })}
          className="w-full accent-neutral-900"
        />
      </div>

      <div className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-black/50">adventurousness</div>
      <div className="mt-2 flex gap-1">
        {LEVELS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFamiliarity(value)}
            className={`flex-1 rounded-lg px-2 py-1.5 font-mono text-[11px] uppercase tracking-wide transition-colors ${
              familiarity === value
                ? "bg-neutral-900 text-white"
                : "border border-black/10 text-black/55 hover:text-black"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
