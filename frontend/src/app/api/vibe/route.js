// HTTP boundary only: validate input → run the use case → return JSON.
// No business logic lives here. Any thrown error is mapped to a safe HTTP
// response by toHttpError, so internals never leak to the client.

import { NextResponse } from "next/server";
import { VibeRequest } from "@/core/domain/vibe.js";
import { getVibeService } from "@/core/config/providers.js";
import { toHttpError, ValidationError } from "@/core/domain/errors.js";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    let payload;
    try {
      payload = await request.json();
    } catch {
      throw new ValidationError("Request body must be JSON");
    }

    const parsed = VibeRequest.safeParse(payload);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request.";
      throw new ValidationError(message, { safeMessage: message });
    }

    const createVibeForMood = getVibeService();
    const vibe = await createVibeForMood(parsed.data);
    return NextResponse.json(vibe);
  } catch (err) {
    console.error(
      "[/api/vibe]",
      err?.name,
      "—",
      err?.message,
      "| cause:",
      err?.cause?.message,
      "| status:",
      err?.cause?.status,
      "| body:",
      typeof err?.cause?.body === "string" ? err.cause.body.slice(0, 300) : undefined
    );
    const { status, body } = toHttpError(err);
    return NextResponse.json(body, { status });
  }
}
