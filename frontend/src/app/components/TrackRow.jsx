"use client";

// One track (light mode). Artwork plays the preview; title/artist/album are
// clickable into the detail browser. The playing row shows an equalizer, an
// accent tint, and a thin accent progress line.

import { trackId } from "./player-utils";

const fmtDur = (ms) => {
  if (!ms) return null;
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export default function TrackRow({ track, index, player, palette, accent, onOpenDetail }) {
  const isCurrent = player.currentId === trackId(track);
  const isPlaying = isCurrent && player.playing;
  const pct = isCurrent ? Math.round(player.progress * 100) : 0;

  const colors = palette?.colors ?? ["#999", "#ccc"];
  const fallback = `linear-gradient(135deg, ${colors[index % colors.length]}, ${
    colors[(index + 2) % colors.length]
  })`;
  const dur = fmtDur(track.durationMs);

  return (
    <div
      className="group relative flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-black/[0.04]"
      style={isCurrent ? { background: `${accent}24` } : undefined}
    >
      <div className="flex w-5 flex-shrink-0 justify-center">
        {isPlaying ? (
          <span className="eq" style={{ color: accent }}>
            <i />
            <i />
            <i />
          </span>
        ) : (
          <span className="font-mono text-xs text-black/35">{String(index + 1).padStart(2, "0")}</span>
        )}
      </div>

      <div className="relative h-11 w-11 flex-shrink-0">
        {track.artworkUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={track.artworkUrl} alt="" loading="lazy" className="h-11 w-11 rounded-md object-cover ring-1 ring-black/10" />
        ) : (
          <div className="h-11 w-11 rounded-md ring-1 ring-black/10" style={{ background: fallback }} />
        )}
        {track.previewUrl && (
          <button
            type="button"
            onClick={() => player.play(track)}
            aria-label={isPlaying ? "Pause preview" : "Play preview"}
            className={`absolute inset-0 flex items-center justify-center rounded-md bg-black/45 text-white transition-opacity ${
              isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <span className="text-sm">{isPlaying ? "❚❚" : "▶"}</span>
          </button>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onOpenDetail({ view: "track", track })}
          className="block max-w-full truncate text-left text-[15px] font-medium text-[#1c1b19] hover:underline"
        >
          {track.title}
        </button>
        <p className="truncate text-[13px] text-black/55">
          <button
            type="button"
            disabled={!track.artistId}
            onClick={() => track.artistId && onOpenDetail({ view: "artist", id: track.artistId })}
            className="enabled:hover:text-black enabled:hover:underline"
          >
            {track.artist}
          </button>
          {track.album && (
            <>
              <span className="text-black/25"> · </span>
              <button
                type="button"
                disabled={!track.collectionId}
                onClick={() => track.collectionId && onOpenDetail({ view: "album", id: track.collectionId })}
                className="enabled:hover:text-black enabled:hover:underline"
              >
                {track.album}
              </button>
            </>
          )}
        </p>
      </div>

      {dur && <span className="flex-shrink-0 font-mono text-[11px] tabular-nums text-black/30">{dur}</span>}
      <a
        href={track.links.spotifySearch}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Search on Spotify"
        className="flex-shrink-0 text-black/30 opacity-0 transition group-hover:opacity-100 hover:text-emerald-600"
      >
        ↗
      </a>

      {isCurrent && (
        <span className="absolute bottom-0 left-0 h-[2px]" style={{ width: `${pct}%`, background: accent }} />
      )}
    </div>
  );
}
