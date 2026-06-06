// Shareable vibe card as a 1200×630 PNG. The vibe is passed compactly in `d`
// (URL-encoded JSON), so the image is a self-contained, linkable artifact.
// Rendered with next/og (Satori) on the edge.

import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  let d = {};
  try {
    d = JSON.parse(searchParams.get("d") || "{}");
  } catch {
    d = {};
  }

  const gf = d.gf || "#2a2440";
  const gt = d.gt || "#4a3a6a";
  const tc = d.tc || "#ffffff";
  const colors = Array.isArray(d.co) && d.co.length ? d.co : [gf, gt];
  const tracks = Array.isArray(d.tr) ? d.tr : [];
  const eyebrow = d.pl ? `${d.fl ? d.fl + " " : ""}the sound of ${d.pl}` : "your vibe";

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#f1efe9", padding: 44, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", width: "100%", borderRadius: 32, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)" }}>
          {/* gradient header */}
          <div style={{ display: "flex", flexDirection: "column", background: `linear-gradient(135deg, ${gf}, ${gt})`, color: tc, padding: 48 }}>
            <div style={{ display: "flex", fontSize: 26, opacity: 0.85, fontStyle: "italic" }}>{eyebrow}</div>
            <div style={{ display: "flex", fontSize: 66, fontWeight: 600, marginTop: 6, lineHeight: 1.04 }}>{d.n || "A vibe"}</div>
            {d.ms ? <div style={{ display: "flex", fontSize: 28, opacity: 0.85, marginTop: 8 }}>{d.ms}</div> : null}
            <div style={{ display: "flex", marginTop: 28, borderRadius: 999, overflow: "hidden" }}>
              {colors.slice(0, 6).map((c, i) => (
                <div key={i} style={{ display: "flex", width: 78, height: 18, background: c }} />
              ))}
            </div>
          </div>
          {/* tracklist */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "#ffffff", padding: "26px 48px", gap: 12 }}>
            {tracks.slice(0, 6).map((t, i) => (
              <div key={i} style={{ display: "flex", fontSize: 25, color: "#1c1b19", alignItems: "baseline" }}>
                <span style={{ display: "flex", width: 40, opacity: 0.4, fontSize: 18 }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ display: "flex", fontWeight: 500 }}>{t[0]}</span>
                <span style={{ display: "flex", opacity: 0.5, marginLeft: 12 }}>— {t[1]}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", background: "#ffffff", padding: "0 48px 28px", fontSize: 20, color: "#9a9a9a" }}>
            <span style={{ display: "flex", fontStyle: "italic" }}>MoodMusica</span>
            <span style={{ display: "flex" }}>the color of your feeling</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
