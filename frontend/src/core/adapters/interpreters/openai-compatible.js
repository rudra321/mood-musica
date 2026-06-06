// Adapter: implements the MoodInterpreter port against ANY OpenAI-compatible
// chat API (Groq, NVIDIA NIM, Google Gemini's OpenAI endpoint, OpenAI, …).
// Parameterized by base URL + key + model names; the curation policy comes from
// the shared core/curation prompts. Two-stage (parse → curate) with a graceful
// fallback to a lighter model on rate-limit (429).

import { Vibe } from "../../domain/vibe.js";
import { InterpreterError } from "../../domain/errors.js";
import { fetchJson } from "../../shared/fetch-json.js";
import { buildBriefPrompt, buildSystemPrompt, buildUserMessage } from "../../curation/build-prompt.js";

const SYSTEM_PROMPT = buildSystemPrompt();
const BRIEF_PROMPT = buildBriefPrompt();

/** Pull a JSON object out of a model response (tolerates code fences / prose). */
function extractJson(content) {
  if (!content) return null;
  const cleaned = content.replace(/```(?:json)?/gi, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function mapToVibe(raw) {
  const palette = raw?.palette ?? {};
  const colors = Array.isArray(palette.colors) ? palette.colors.slice(0, 6) : [];
  return {
    palette: {
      name: palette.name,
      colors,
      gradientFrom: palette.gradientFrom,
      gradientTo: palette.gradientTo,
    },
    mood: { label: raw?.mood?.label, subtitle: raw?.mood?.subtitle },
    // Drop malformed entries (some models emit a stray track missing artist/title).
    tracks: Array.isArray(raw?.tracks)
      ? raw.tracks.filter((t) => t && t.artist && t.title).slice(0, 20)
      : [],
  };
}

/**
 * @param {{
 *   apiKey: string, baseUrl: string, model: string,
 *   briefModel?: string, fallbackModel?: string, http?: typeof fetchJson,
 * }} cfg
 * @returns {import("../../ports/mood-interpreter.js").MoodInterpreter}
 */
export function createOpenAICompatibleInterpreter({ apiKey, baseUrl, model, briefModel, fallbackModel, extraBody = {}, http = fetchJson }) {
  if (!apiKey) throw new InterpreterError("Interpreter API key is missing");
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const briefM = briefModel || model;
  const fallbackM = fallbackModel || model;

  async function chat(system, user, temperature, useModel, image) {
    // With an image, the user turn becomes a multimodal content array (vision).
    const userContent = image
      ? [
          { type: "text", text: user },
          { type: "image_url", image_url: { url: image } },
        ]
      : user;
    let data;
    try {
      data = await http(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        timeoutMs: 30000, // some models (e.g. Gemini Flash "thinking") are slow on big JSON
        body: JSON.stringify({
          model: useModel,
          temperature,
          response_format: { type: "json_object" },
          ...extraBody,
          messages: [
            { role: "system", content: system },
            { role: "user", content: userContent },
          ],
        }),
      });
    } catch (err) {
      throw new InterpreterError("Interpreter request failed", { cause: err });
    }
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new InterpreterError("Interpreter returned an empty response");
    const parsed = extractJson(content);
    if (!parsed) throw new InterpreterError("Interpreter did not return valid JSON");
    return parsed;
  }

  return {
    async interpret(context) {
      const image = context.image || null;

      // Stage 1 — understand the text on the cheap model. Best-effort.
      // Skipped for photo-only requests (the vision curate reads the image).
      let brief = null;
      if (!image && context.mood) {
        try {
          brief = await chat(BRIEF_PROMPT, context.mood, 0.4, briefM);
        } catch {
          brief = null;
        }
      }

      // Stage 2 — curate (vision when an image is present); fall back on rate-limit.
      const userMsg = buildUserMessage({ ...context, brief });
      let raw;
      try {
        raw = await chat(SYSTEM_PROMPT, userMsg, 1.0, model, image);
      } catch (e) {
        const status = e?.cause?.status;
        // Rate-limited (429) or transiently overloaded (5xx) → try the lighter model.
        const retryable = status === 429 || (status >= 500 && status < 600);
        if (retryable && model !== fallbackM) {
          raw = await chat(SYSTEM_PROMPT, userMsg, 1.0, fallbackM, image);
        } else if (status === 429) {
          throw new InterpreterError("Daily token/rate limit reached", {
            safeMessage: "The free AI quota is maxed out for now — try again shortly.",
            cause: e,
          });
        } else {
          throw e;
        }
      }

      const result = Vibe.safeParse({ ...mapToVibe(raw), interpretation: brief ?? null });
      if (!result.success) {
        throw new InterpreterError(`Interpreter output failed schema validation: ${result.error.message}`, {
          cause: result.error,
        });
      }
      return result.data;
    },
  };
}
