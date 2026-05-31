// Pure color math. No I/O, no framework. Reused by the service (to derive a
// readable text color for the card) and available to the UI if needed.

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** @param {unknown} value */
export function isHexColor(value) {
  return typeof value === "string" && HEX_RE.test(value.trim());
}

/**
 * @param {string} value
 * @param {string} [fallback]
 */
export function normalizeHex(value, fallback = "#000000") {
  return isHexColor(value) ? value.trim().toLowerCase() : fallback;
}

function channel(hex, index) {
  return parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255;
}

function toLinear(c) {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * WCAG relative luminance (0 = black, 1 = white).
 * @param {string} hex
 */
export function relativeLuminance(hex) {
  const h = normalizeHex(hex);
  const r = toLinear(channel(h, 0));
  const g = toLinear(channel(h, 1));
  const b = toLinear(channel(h, 2));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Pick black or white text for readable contrast against a background.
 * @param {string} backgroundHex
 * @returns {string} hex
 */
export function contrastTextColor(backgroundHex) {
  return relativeLuminance(backgroundHex) > 0.4 ? "#111111" : "#ffffff";
}

// --- HSL helpers + a vividness floor -----------------------------------------
// "Color of the feeling" dies if the model returns greys. vivify() preserves the
// chosen hue but enforces a minimum saturation and clamps lightness, so the
// aurora + palette always have life — no matter how timid the brain's output.

function hexToRgb(hex) {
  const h = normalizeHex(hex);
  return [0, 1, 2].map((i) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16));
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}

function hue2rgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslToHex(h, s, l) {
  let r;
  let g;
  let b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const to = (x) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

/**
 * Enforce a saturation floor + lightness clamp while preserving hue.
 * @param {string} hex
 * @param {{ minS?: number, minL?: number, maxL?: number }} [opts]
 */
export function vivify(hex, { minS = 0.45, minL = 0.22, maxL = 0.72 } = {}) {
  const [r, g, b] = hexToRgb(hex);
  let [h, s, l] = rgbToHsl(r, g, b);
  s = Math.max(s, minS);
  l = Math.min(Math.max(l, minL), maxL);
  return hslToHex(h, s, l);
}
