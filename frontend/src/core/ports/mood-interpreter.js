// Port: the contract the application depends on for "turn a mood (+ optional
// place and local-chart context) into a Vibe". Adapters (Groq, rule-based, ...)
// implement this shape. The service never imports a concrete adapter.

/**
 * @typedef {object} MoodInterpreter
 * @property {(context: import("../domain/vibe.js").InterpretContext) => Promise<import("../domain/vibe.js").TVibe>} interpret
 */

export {};
