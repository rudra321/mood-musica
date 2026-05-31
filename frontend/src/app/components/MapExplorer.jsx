"use client";

// Map-first experience (light mode). The map fills the screen; a floating mood
// bar sits on top; tapping a place (or "surprise me") surfaces that region's
// mood in a panel over the map. Owns the request lifecycle + global audio engine.

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import VibeCard from "./VibeCard";
import NowPlaying from "./NowPlaying";
import Tuner, { ERA_MIN, ERA_MAX } from "./Tuner";
import DetailModal from "./DetailModal";
import VibesRail from "./VibesRail";
import { trackId } from "./player-utils";
import { Sparkles, Locate, Sliders, ArrowRight } from "./icons";

const MapCanvas = dynamic(() => import("./MapCanvas"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#e9e6df]" />,
});

const LOADING_LINES = ["Listening…", "Mixing the colors…", "Cueing the songs…"];

// For "surprise me".
const CITIES = [
  { lat: 35.68, lng: 139.69 }, { lat: 6.52, lng: 3.38 }, { lat: 38.72, lng: -9.14 },
  { lat: 26.91, lng: 75.79 }, { lat: 37.57, lng: 126.98 }, { lat: 19.43, lng: -99.13 },
  { lat: 64.15, lng: -21.94 }, { lat: -1.29, lng: 36.82 }, { lat: 41.01, lng: 28.98 },
  { lat: -23.55, lng: -46.63 }, { lat: 31.63, lng: -7.99 }, { lat: 29.95, lng: -90.07 },
];
const MOODS = [
  "rainy nostalgia", "late-night drive", "festive evening", "heartbroken but free",
  "sunrise calm", "dancefloor euphoria", "golden hour", "3am overthinking",
  "road trip", "rainy day folk",
];
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default function MapExplorer() {
  const [mood, setMood] = useState("");
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [vibe, setVibe] = useState(null);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const [explored, setExplored] = useState([]);
  const [era, setEra] = useState({ from: null, to: null });
  const [familiarity, setFamiliarity] = useState("balanced");
  const [tunerOpen, setTunerOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  // --- global audio engine ---
  const audioRef = useRef(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    const onTime = () => setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => { setPlaying(false); setProgress(0); };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  function play(track) {
    const audio = audioRef.current;
    if (!audio || !track?.previewUrl) return;
    if (currentTrack && trackId(currentTrack) === trackId(track)) {
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
      return;
    }
    audio.src = track.previewUrl;
    setCurrentTrack(track);
    setProgress(0);
    audio.play().catch(() => {});
  }

  const player = {
    currentId: currentTrack ? trackId(currentTrack) : null,
    currentTrack,
    playing,
    progress,
    play,
  };

  const [lineIdx, setLineIdx] = useState(0);
  useEffect(() => {
    if (status !== "loading") return;
    setLineIdx(0);
    const id = setInterval(() => setLineIdx((i) => (i + 1) % LOADING_LINES.length), 1400);
    return () => clearInterval(id);
  }, [status]);

  function flashHint(msg) {
    setHint(msg);
    setTimeout(() => setHint(""), 3200);
  }

  function seenIds() {
    const ids = explored.flatMap((e) => e.vibe.tracks.map((t) => trackId(t)));
    return [...new Set(ids)].slice(-60);
  }

  async function fetchVibe(text, c) {
    setStatus("loading");
    setError("");
    const body = { mood: text, lat: c.lat, lng: c.lng, familiarity, seed: Math.floor(Math.random() * 1e9) };
    if (era.from != null && era.from > ERA_MIN) body.eraFrom = era.from;
    if (era.to != null && era.to < ERA_MAX) body.eraTo = era.to;
    const exclude = seenIds();
    if (exclude.length) body.exclude = exclude;
    try {
      const res = await fetch("/api/vibe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Something went wrong.");
      setVibe(data);
      setStatus("done");
      setExplored((prev) => [...prev, { coords: c, vibe: data, accent: data?.palette?.colors?.[0], mood: text }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStatus("error");
    }
  }

  function pick(c) {
    setCoords(c);
    const text = mood.trim();
    if (!text) {
      flashHint("Type a mood first, then tap a place ↑");
      return;
    }
    fetchVibe(text, c);
  }

  function onMoodSubmit() {
    const text = mood.trim();
    if (!text) return;
    if (coords) fetchVibe(text, coords);
    else flashHint("Now tap a place on the map →");
  }

  function replayExplored(e) {
    setCoords(e.coords);
    setVibe(e.vibe);
    setStatus("done");
  }

  function locateMe() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      flashHint("Location unavailable — tap the map instead");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => pick({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => flashHint("Couldn't get your location — tap the map instead")
    );
  }

  function surprise() {
    const c = rand(CITIES);
    const m = rand(MOODS);
    setMood(m);
    setCoords(c);
    fetchVibe(m, c);
  }

  const accent = vibe?.palette?.colors?.[0];
  const panelOpen = status === "loading" || status === "done" || status === "error";

  const iconBtn =
    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-black/10 text-black/55 transition-colors hover:border-black/30 hover:text-black";

  return (
    <div className="fixed inset-0 overflow-hidden text-[#1c1b19]">
      <div className="absolute inset-0 z-0">
        <MapCanvas
          selected={coords}
          onPick={pick}
          accent={accent}
          explored={explored}
          onSelectExplored={replayExplored}
        />
      </div>

      <span className="pointer-events-none absolute left-5 top-4 z-20 font-display text-lg italic text-black/80">
        MoodMusica
      </span>

      <div className="absolute left-1/2 top-4 z-20 w-[min(94vw,580px)] -translate-x-1/2">
        <form
          onSubmit={(e) => { e.preventDefault(); onMoodSubmit(); }}
          className="glass flex items-center gap-2 rounded-2xl p-2 shadow-xl shadow-black/10"
        >
          <input
            type="text"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            maxLength={280}
            placeholder="How are you feeling?"
            aria-label="Describe your mood"
            className="flex-1 bg-transparent px-3 py-2 text-[#1c1b19] placeholder:text-black/35 focus:outline-none"
          />
          <button type="button" onClick={surprise} aria-label="Surprise me" className={iconBtn}>
            <Sparkles className="h-5 w-5" />
          </button>
          <button type="button" onClick={locateMe} aria-label="Use my location" className={iconBtn}>
            <Locate className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setTunerOpen((v) => !v)}
            aria-label="Tune era and adventurousness"
            aria-pressed={tunerOpen}
            className={`${iconBtn} ${tunerOpen ? "border-black/40 text-black" : ""}`}
          >
            <Sliders className="h-5 w-5" />
          </button>
          <button
            type="submit"
            aria-label="Reveal"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white transition-transform hover:scale-105"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </form>

        {tunerOpen && (
          <Tuner era={era} setEra={setEra} familiarity={familiarity} setFamiliarity={setFamiliarity} />
        )}

        <AnimatePresence>
          {hint && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 text-center font-mono text-xs text-black/70"
            >
              {hint}
            </motion.p>
          )}
        </AnimatePresence>
        {!panelOpen && !hint && (
          <p className="mt-2 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-black/40">
            tap anywhere on the map
          </p>
        )}
      </div>

      <AnimatePresence>
        {panelOpen && (
          <motion.aside
            key="panel"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            className="glass absolute inset-x-0 bottom-0 z-30 h-[74vh] overflow-y-auto rounded-t-3xl p-5 pb-28 shadow-2xl shadow-black/20 md:inset-y-0 md:right-auto md:left-0 md:h-full md:w-[440px] md:rounded-r-3xl md:rounded-tl-none md:pb-28"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-black/45">
                {vibe?.place ? vibe.place.label : "your vibe"}
              </span>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                aria-label="Close"
                className="text-black/45 transition-colors hover:text-black"
              >
                ✕
              </button>
            </div>

            {status === "loading" && (
              <div className="flex h-[60%] flex-col items-center justify-center gap-3 text-center">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-black/15 border-t-black/70" />
                <AnimatePresence mode="wait">
                  <motion.p
                    key={lineIdx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-mono text-sm text-black/50"
                  >
                    {LOADING_LINES[lineIdx]}
                  </motion.p>
                </AnimatePresence>
              </div>
            )}

            {status === "error" && (
              <p className="mt-8 text-center font-mono text-sm text-red-600">{error}</p>
            )}

            {status === "done" && vibe && <VibeCard vibe={vibe} player={player} onOpenDetail={setDetail} />}
          </motion.aside>
        )}
      </AnimatePresence>

      <VibesRail explored={explored} onSelect={replayExplored} />
      <DetailModal open={detail} player={player} onClose={() => setDetail(null)} />
      <NowPlaying player={player} />
    </div>
  );
}
