// Small presentation helpers shared by the card + the vibes rail.

/** 2-letter country code → flag emoji. */
export const flagOf = (cc) =>
  cc && cc.length === 2
    ? cc.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    : "";

/** Trim a geocoder label down to a clean city name ("Jaipur Municipal Corporation, India" → "Jaipur"). */
export const cityOf = (label) => {
  const first = (label || "").split(",")[0] || label || "";
  return (
    first
      .replace(/\b(Municipal Corporation|Municipality|District|Division|Metropolitan|Prefecture|County|Tehsil|Mandal|City|State|Province)\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim() || first
  );
};

/** Map a free-text energy phrase to a 1–3 level for the meter. */
export const energyLevel = (e) => {
  const s = String(e || "").toLowerCase();
  if (/high|intense|energet|euphor|hype/.test(s)) return 3;
  if (/low|calm|mellow|gentle|slow|quiet/.test(s)) return 1;
  return 2;
};
