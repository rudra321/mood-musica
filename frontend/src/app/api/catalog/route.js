// HTTP boundary for browsing the catalog: GET /api/catalog?type=artist|album&id=…
// (iTunes lookup isn't CORS-friendly, so it must run server-side.)

import { NextResponse } from "next/server";
import { getCatalog } from "@/core/config/providers.js";
import { toHttpError, ValidationError } from "@/core/domain/errors.js";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = Number(searchParams.get("id"));
    if (!id || (type !== "artist" && type !== "album")) {
      throw new ValidationError("type must be 'artist' or 'album' and id is required");
    }

    const catalog = getCatalog();
    const data = type === "artist" ? await catalog.artist(id) : await catalog.album(id);
    if (!data) {
      throw new ValidationError("Not found", { status: 404, safeMessage: "Couldn't load that." });
    }
    return NextResponse.json(data);
  } catch (err) {
    const { status, body } = toHttpError(err);
    return NextResponse.json(body, { status });
  }
}
