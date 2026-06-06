// Adapter: tries a chain of interpreters in order, returning the first success.
// Lets the app degrade gracefully when a brain is rate-limited/quota-capped
// (Gemini → Groq → rule-based). The last link should be the zero-key rule-based
// interpreter, which never fails — so the app always returns a vibe.

import { InterpreterError } from "../../domain/errors.js";

/**
 * @param {{ chain: import("../../ports/mood-interpreter.js").MoodInterpreter[] }} cfg
 * @returns {import("../../ports/mood-interpreter.js").MoodInterpreter}
 */
export function createFallbackInterpreter({ chain }) {
  return {
    async interpret(context) {
      let lastErr;
      for (const interp of chain) {
        try {
          return await interp.interpret(context);
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr ?? new InterpreterError("No interpreter available");
    },
  };
}
