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
import TripCard from "./TripCard";
import Spinner from "./Spinner";
import { trackId } from "./player-utils";
import { Sparkles, Locate, Sliders, ArrowRight, Image as ImageIcon, Route } from "./icons";

// Downscale a picked image client-side → small JPEG data URL for the vision call.
function downscaleImage(file, max = 768) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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
  const [tripMode, setTripMode] = useState(false);
  const [stops, setStops] = useState([]);
  const [trip, setTrip] = useState(null);
  const [tripStatus, setTripStatus] = useState("idle"); // idle | loading | done | error

  const photoInputRef = useRef(null);

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

  async function fetchVibe({ mood: text, coords: c, image }) {
    setStatus("loading");
    setError("");
    const body = { familiarity, seed: Math.floor(Math.random() * 1e9) };
    if (text) body.mood = text;
    if (image) body.image = image;
    if (c) {
      body.lat = c.lat;
      body.lng = c.lng;
    }
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
      setExplored((prev) => [
        ...prev,
        { coords: c || null, vibe: data, accent: data?.palette?.colors?.[0], mood: text || "📷 photo" },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStatus("error");
    }
  }

  function pick(c) {
    if (tripMode) {
      setStops((prev) => [...prev, c]);
      setCoords(c); // flyTo the new stop
      return;
    }
    setCoords(c);
    const text = mood.trim();
    if (!text) {
      flashHint("Type a mood first, then tap a place ↑");
      return;
    }
    fetchVibe({ mood: text, coords: c });
  }

  function toggleTrip() {
    setTripMode((on) => {
      const next = !on;
      if (next) {
        setStops([]);
        setTrip(null);
        setTripStatus("idle");
        setStatus("idle");
      }
      return next;
    });
  }

  // One vibe for a stop, returned (not stored) — used to build the trip.
  async function vibeForStop(c) {
    const body = { mood: mood.trim(), lat: c.lat, lng: c.lng, familiarity, seed: Math.floor(Math.random() * 1e9) };
    if (era.from != null && era.from > ERA_MIN) body.eraFrom = era.from;
    if (era.to != null && era.to < ERA_MAX) body.eraTo = era.to;
    const res = await fetch("/api/vibe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || "Something went wrong.");
    return data;
  }

  async function buildTrip() {
    if (!mood.trim()) {
      flashHint("Type a mood for the trip ↑");
      return;
    }
    if (stops.length < 2) {
      flashHint("Tap at least 2 stops on the map");
      return;
    }
    setTripStatus("loading");
    setTrip(null);
    // Resilient: one bad stop (ocean, geocode/quota hiccup) shouldn't sink the trip.
    const settled = await Promise.allSettled(stops.map(vibeForStop));
    const vibes = settled.filter((s) => s.status === "fulfilled").map((s) => s.value);
    if (vibes.length < 2) {
      setError("Couldn't reach enough of those places — try different stops.");
      setTripStatus("error");
      return;
    }
    setTrip(vibes.map((v) => ({ vibe: v })));
    setTripStatus("done");
  }

  function onMoodSubmit() {
    if (loading) return;
    if (tripMode) {
      buildTrip();
      return;
    }
    const text = mood.trim();
    if (!text) return;
    if (coords) fetchVibe({ mood: text, coords });
    else flashHint("Now tap a place on the map →");
  }

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setTripMode(false);
    setStatus("loading"); // show the spinner immediately while we read/resize
    try {
      const image = await downscaleImage(file);
      fetchVibe({ mood: mood.trim(), coords, image });
    } catch {
      setStatus("idle");
      flashHint("Couldn't read that image");
    }
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
    setTripMode(false);
    const c = rand(CITIES);
    const m = rand(MOODS);
    setMood(m);
    setCoords(c);
    fetchVibe({ mood: m, coords: c });
  }

  const accent = vibe?.palette?.colors?.[0];
  const loading = status === "loading" || tripStatus === "loading";
  const singleOpen = !tripMode && (status === "loading" || status === "done" || status === "error");
  const panelOpen = singleOpen || tripMode;

  const iconBtn =
    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-black/10 text-black/55 transition-colors hover:border-black/30 hover:text-black disabled:opacity-40 disabled:hover:border-black/10 disabled:hover:text-black/55";

  return (
    <div className="fixed inset-0 overflow-hidden text-[#1c1b19]">
      <div className="absolute inset-0 z-0">
        <MapCanvas
          selected={coords}
          onPick={pick}
          accent={accent}
          explored={explored}
          onSelectExplored={replayExplored}
          stops={tripMode ? stops : []}
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
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={onPhoto}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            aria-label="Photo to soundtrack"
            disabled={loading}
            className={iconBtn}
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          <button type="button" onClick={surprise} aria-label="Surprise me" disabled={loading} className={iconBtn}>
            <Sparkles className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={toggleTrip}
            aria-label="Road trip mode"
            aria-pressed={tripMode}
            className={`${iconBtn} ${tripMode ? "border-black/40 text-black" : ""}`}
          >
            <Route className="h-5 w-5" />
          </button>
          <button type="button" onClick={locateMe} aria-label="Use my location" disabled={loading} className={iconBtn}>
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
            aria-label={tripMode ? "Build trip" : "Reveal"}
            disabled={loading}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white transition-transform hover:scale-105 disabled:hover:scale-100"
          >
            {loading ? (
              <Spinner className="h-[18px] w-[18px] border-white/40 border-t-white" />
            ) : (
              <ArrowRight className="h-5 w-5" />
            )}
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
            {tripMode ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-black/45">
                    road trip · {stops.length} stop{stops.length === 1 ? "" : "s"}
                  </span>
                  <button type="button" onClick={toggleTrip} aria-label="Exit trip mode" className="text-black/45 transition-colors hover:text-black">
                    ✕
                  </button>
                </div>

                {tripStatus === "loading" ? (
                  <div className="flex h-[60%] flex-col items-center justify-center gap-3 text-center">
                    <Spinner className="h-8 w-8 border-black/15 border-t-black/70" />
                    <p className="font-mono text-sm text-black/50">Charting the journey…</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3">
                      {!trip && (
                        <p className="font-mono text-sm leading-relaxed text-black/55">
                          Tap stops on the map (2+), set a mood, then build one journey through their sounds.
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={buildTrip}
                          disabled={stops.length < 2}
                          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                        >
                          {trip ? "Rebuild" : "Build trip"}
                        </button>
                        {stops.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setStops([]);
                              setTrip(null);
                            }}
                            className="rounded-xl border border-black/10 px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-black/55 hover:text-black"
                          >
                            clear
                          </button>
                        )}
                      </div>
                      {tripStatus === "error" && <p className="font-mono text-sm text-red-600">{error}</p>}
                    </div>
                    {trip && <TripCard trip={trip} player={player} onOpenDetail={setDetail} />}
                  </div>
                )}
              </>
            ) : (
              <>
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
                    <Spinner className="h-8 w-8 border-black/15 border-t-black/70" />
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
              </>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      <VibesRail explored={explored} onSelect={replayExplored} />
      <DetailModal open={detail} player={player} onClose={() => setDetail(null)} />
      <NowPlaying player={player} />
    </div>
  );
}
