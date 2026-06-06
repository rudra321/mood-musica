"use client";

// In-app music browser (light mode). Opens on a track / artist / album and lets
// you drill around with a back stack, all over the global player. Artist/album
// data is fetched from /api/catalog.

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { trackId } from "./player-utils";
import { Play, Pause, ExternalLink, Close, ChevronLeft } from "./icons";
import Spinner from "./Spinner";

const fmtDur = (ms) => {
  if (!ms) return null;
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

function PlayArt({ track, player, size = "h-12 w-12" }) {
  const isCurrent = player.currentId === trackId(track);
  const isPlaying = isCurrent && player.playing;
  return (
    <div className={`relative flex-shrink-0 ${size}`}>
      {track.artworkUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={track.artworkUrl} alt="" className={`${size} rounded-md object-cover ring-1 ring-black/10`} />
      ) : (
        <div className={`${size} rounded-md bg-black/10`} />
      )}
      {track.previewUrl && (
        <button
          type="button"
          onClick={() => player.play(track)}
          aria-label={isPlaying ? "Pause" : "Play"}
          className={`absolute inset-0 flex items-center justify-center rounded-md bg-black/30 transition-opacity ${
            isCurrent ? "opacity-100" : "opacity-0 hover:opacity-100"
          }`}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-black shadow-sm">
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 translate-x-[1px]" />}
          </span>
        </button>
      )}
    </div>
  );
}

function SongRow({ track, player, onOpenTrack }) {
  return (
    <li className="flex items-center gap-3 py-2">
      <PlayArt track={track} player={player} size="h-11 w-11" />
      <button type="button" onClick={() => onOpenTrack(track)} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-medium text-[#1c1b19] hover:underline">{track.title}</p>
        <p className="truncate text-xs text-black/50">{track.artist}</p>
      </button>
      {fmtDur(track.durationMs) && (
        <span className="flex-shrink-0 font-mono text-[11px] text-black/35">{fmtDur(track.durationMs)}</span>
      )}
    </li>
  );
}

function TrackView({ track, player, push }) {
  return (
    <div>
      <div className="flex gap-4">
        <PlayArt track={track} player={player} size="h-28 w-28" />
        <div className="min-w-0">
          <h3 className="font-display text-2xl leading-tight text-[#1c1b19]">{track.title}</h3>
          {track.artistId ? (
            <button type="button" onClick={() => push({ view: "artist", id: track.artistId })} className="mt-1 block text-left text-black/70 hover:text-black hover:underline">
              {track.artist}
            </button>
          ) : (
            <p className="mt-1 text-black/70">{track.artist}</p>
          )}
          {track.collectionId ? (
            <button type="button" onClick={() => push({ view: "album", id: track.collectionId })} className="mt-0.5 block text-left text-sm text-black/45 hover:text-black hover:underline">
              {track.album}
            </button>
          ) : (
            track.album && <p className="mt-0.5 text-sm text-black/45">{track.album}</p>
          )}
        </div>
      </div>

      <p className="mt-4 font-mono text-[11px] uppercase tracking-wide text-black/40">
        {[track.year, track.genre, fmtDur(track.durationMs)].filter(Boolean).join(" · ")}
      </p>
      {track.why && <p className="mt-3 font-display text-sm italic text-black/60">“{track.why}”</p>}

      <div className="mt-5 flex gap-4 font-mono text-[11px] uppercase tracking-wide">
        {track.links?.apple && (
          <a href={track.links.apple} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-black/55 hover:text-black">
            Apple Music <ExternalLink className="h-3 w-3" />
          </a>
        )}
        <a href={track.links.spotifySearch} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-black/55 hover:text-emerald-600">
          Spotify <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

function useCatalog(type, id) {
  const [data, setData] = useState(null);
  const [state, setState] = useState("loading");
  useEffect(() => {
    let alive = true;
    setState("loading");
    fetch(`/api/catalog?type=${type}&id=${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => alive && (setData(d), setState("done")))
      .catch(() => alive && setState("error"));
    return () => {
      alive = false;
    };
  }, [type, id]);
  return { data, state };
}

function Loading() {
  return (
    <div className="flex h-40 items-center justify-center">
      <Spinner className="h-7 w-7 border-black/15 border-t-black/70" />
    </div>
  );
}

function ArtistView({ id, player, push }) {
  const { data, state } = useCatalog("artist", id);
  if (state === "loading") return <Loading />;
  if (state === "error" || !data) return <p className="text-black/50">Couldn’t load this artist.</p>;
  return (
    <div>
      <h3 className="font-display text-2xl text-[#1c1b19]">{data.name}</h3>
      {data.appleUrl && (
        <a href={data.appleUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-mono text-[11px] uppercase tracking-wide text-black/45 hover:text-black">
          Apple Music <ExternalLink className="ml-1 inline h-3 w-3 align-[-1px]" />
        </a>
      )}

      {data.albums?.length > 0 && (
        <>
          <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-black/40">Albums</p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {data.albums.map((al) => (
              <button key={al.id} type="button" onClick={() => push({ view: "album", id: al.id })} className="text-left">
                {al.artworkUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={al.artworkUrl} alt="" className="aspect-square w-full rounded-md object-cover ring-1 ring-black/10" />
                ) : (
                  <div className="aspect-square w-full rounded-md bg-black/10" />
                )}
                <p className="mt-1 truncate text-xs text-[#1c1b19]">{al.name}</p>
                <p className="truncate font-mono text-[10px] text-black/40">{al.year}</p>
              </button>
            ))}
          </div>
        </>
      )}

      {data.topSongs?.length > 0 && (
        <>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-black/40">Top songs</p>
          <ul className="mt-1 divide-y divide-black/[0.06]">
            {data.topSongs.map((t, i) => (
              <SongRow key={`${trackId(t)}-${i}`} track={t} player={player} onOpenTrack={(track) => push({ view: "track", track })} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function AlbumView({ id, player, push }) {
  const { data, state } = useCatalog("album", id);
  if (state === "loading") return <Loading />;
  if (state === "error" || !data) return <p className="text-black/50">Couldn’t load this album.</p>;
  return (
    <div>
      <div className="flex gap-4">
        {data.artworkUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.artworkUrl} alt="" className="h-24 w-24 flex-shrink-0 rounded-md object-cover ring-1 ring-black/10" />
        ) : (
          <div className="h-24 w-24 flex-shrink-0 rounded-md bg-black/10" />
        )}
        <div className="min-w-0">
          <h3 className="font-display text-xl leading-tight text-[#1c1b19]">{data.name}</h3>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-black/40">{data.year}</p>
          {data.appleUrl && (
            <a href={data.appleUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-mono text-[11px] uppercase tracking-wide text-black/45 hover:text-black">
              Apple Music ↗
            </a>
          )}
        </div>
      </div>
      <ul className="mt-4 divide-y divide-black/[0.06]">
        {data.tracks?.map((t, i) => (
          <SongRow key={`${trackId(t)}-${i}`} track={t} player={player} onOpenTrack={(track) => push({ view: "track", track })} />
        ))}
      </ul>
    </div>
  );
}

export default function DetailModal({ open, player, onClose }) {
  const [stack, setStack] = useState([]);
  useEffect(() => {
    if (open) setStack([open]);
  }, [open]);

  const top = stack[stack.length - 1];
  const push = (v) => setStack((s) => [...s, v]);
  const back = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));

  const title = top?.view === "track" ? top.track.title : top?.view === "artist" ? "Artist" : top?.view === "album" ? "Album" : "";

  return (
    <AnimatePresence>
      {open && top && (
        <motion.div
          className="fixed inset-0 z-40 flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/10" onClick={onClose} />
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              background: "rgba(255,255,255,0.5)",
              backdropFilter: "blur(12px) saturate(140%)",
              WebkitBackdropFilter: "blur(12px) saturate(140%)",
            }}
            className="relative max-h-[88vh] w-full overflow-y-auto rounded-t-3xl border border-white/60 p-6 shadow-2xl shadow-black/20 sm:max-w-lg sm:rounded-3xl"
          >
            <div className="mb-4 flex items-center justify-between">
              {stack.length > 1 ? (
                <button type="button" onClick={back} className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-[0.2em] text-black/50 hover:text-black">
                  <ChevronLeft className="h-3.5 w-3.5" /> back
                </button>
              ) : (
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-black/40">{title}</span>
              )}
              <button type="button" onClick={onClose} aria-label="Close" className="text-black/50 hover:text-black">
                <Close className="h-4 w-4" />
              </button>
            </div>

            {top.view === "track" && <TrackView track={top.track} player={player} push={push} />}
            {top.view === "artist" && <ArtistView id={top.id} player={player} push={push} />}
            {top.view === "album" && <AlbumView id={top.id} player={player} push={push} />}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
