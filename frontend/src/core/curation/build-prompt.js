// Composes the curation instruction fragments into prompts. Single assembly
// point: the ordered lists below ARE the policy. Two stages:
//   1. buildBriefPrompt()  — understand the free text into a structured brief.
//   2. buildSystemPrompt() + buildUserMessage() — curate from the brief + context.

import * as rules from "./instructions.js";

export const CANDIDATE_COUNT = 12; // over-generate; the service verifies + trims
export const FINAL_COUNT = 8;

const bullet = (s) => `- ${s}`;

/** Stage 1: parse free text → structured brief. */
export function buildBriefPrompt() {
  return rules.BRIEF_PROMPT;
}

/** Stage 2: the static curation policy (same for every request). */
export function buildSystemPrompt() {
  return [
    rules.ROLE,
    "",
    "Rules:",
    bullet(rules.SONG_REALITY),
    bullet(rules.MOOD_PRIMACY),
    bullet(rules.ANTI_CANON),
    bullet(rules.IMAGE_RULE),
    bullet(rules.PLACE_RULE),
    bullet(rules.LOCAL_LANGUAGE),
    bullet(rules.CHART_HINT_RULE),
    bullet(rules.PALETTE_RULE),
    bullet(rules.songCount(CANDIDATE_COUNT)),
    "",
    rules.outputFormat(CANDIDATE_COUNT),
  ].join("\n");
}

/** Stage 2: per-request context — mood, brief, place, weather, chart, era, familiarity, exclude, seed. */
export function buildUserMessage({ mood, image, brief, place, weather, chart, era, familiarity, exclude, seed }) {
  const parts = [
    mood ? `Mood: ${mood}` : "Mood: derive it from the shared photo — its colors and feeling.",
  ];

  if (brief) {
    parts.push(`Parsed brief (use it to target the picks precisely):\n${JSON.stringify(brief)}`);
  }
  if (place) {
    parts.push(
      `Place: ${place.label} (country ${place.countryCode.toUpperCase()}). Favor music rooted in this place/region.`
    );
  }
  if (weather && (weather.localHour != null || weather.description)) {
    const bits = [
      weather.partOfDay && `it's ${weather.partOfDay}`,
      weather.description,
      weather.tempC != null && `${weather.tempC}°C`,
    ].filter(Boolean).join(", ");
    parts.push(`Right now there: ${bits}. Let this subtly color the selection (e.g. a rainy night vs a bright morning), without overriding the mood.`);
  }

  const eraLine = rules.eraRule(era);
  if (eraLine) parts.push(eraLine);

  parts.push(rules.familiarityRule(familiarity));

  if (chart && chart.length) {
    const list = chart.slice(0, 8).map((c) => `- ${c.artist} – ${c.title}`).join("\n");
    parts.push(`${rules.CHART_HINT_HEADER}\n${list}`);
  }

  const excludeLine = rules.excludeRule(exclude);
  if (excludeLine) parts.push(excludeLine);

  parts.push(rules.noveltyRule(seed));

  return parts.join("\n\n");
}
