// One coherent inline-SVG icon set — replaces the ad-hoc text glyphs (▶ ❚❚ ⚙ 🎲 ↗)
// so every control is crisp and consistent. All use currentColor; size via
// className (e.g. h-4 w-4).

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

// Filled icons get a round-joined stroke of the same color so their corners and
// tips are soft — matching the curved UI instead of reading as sharp vectors.
const soft = {
  fill: "currentColor",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinejoin: "round",
  strokeLinecap: "round",
};

export function Play({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...soft}>
      <path d="M8 5.6c0-.86.94-1.39 1.67-.94l9.4 5.9a1.1 1.1 0 0 1 0 1.88l-9.4 5.9A1.1 1.1 0 0 1 8 17.4V5.6Z" />
    </svg>
  );
}

export function Pause({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...soft}>
      <rect x="6.8" y="5.4" width="3.4" height="13.2" rx="1.7" />
      <rect x="13.8" y="5.4" width="3.4" height="13.2" rx="1.7" />
    </svg>
  );
}

export function Sparkles({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...soft} strokeWidth="2.4">
      <path d="M10 2.5C10.7 7.7 12.3 9.3 17.5 10C12.3 10.7 10.7 12.3 10 17.5C9.3 12.3 7.7 10.7 2.5 10C7.7 9.3 9.3 7.7 10 2.5Z" />
      <path d="M18.4 13.6C18.7 15.7 19.3 16.3 21.4 16.6C19.3 16.9 18.7 17.5 18.4 19.6C18.1 17.5 17.5 16.9 15.4 16.6C17.5 16.3 18.1 15.7 18.4 13.6Z" opacity="0.9" />
    </svg>
  );
}

export function Locate({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      <circle cx="12" cy="12" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Sliders({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <path d="M4 8h10M18 8h2M4 16h2M10 16h10" />
      <circle cx="16" cy="8" r="2.2" />
      <circle cx="8" cy="16" r="2.2" />
    </svg>
  );
}

export function ArrowRight({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

export function ExternalLink({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <path d="M9 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
      <path d="M14 4h6v6M20 4l-9 9" />
    </svg>
  );
}

export function Close({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function ChevronLeft({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
