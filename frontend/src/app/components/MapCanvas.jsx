"use client";

// Full-bleed interactive map (the primary surface). Free Leaflet + dark Carto
// tiles, no API key.
//  - Click anywhere to pick a place.
//  - The camera flies to the picked point.
//  - The active pin pulses in the current vibe's color.
//  - Every place you've explored stays on the map as a colored dot you can tap
//    to replay it from memory.
// divIcon (HTML/CSS) markers avoid Leaflet's default marker-image asset breakage.
// Loaded via next/dynamic { ssr:false } — Leaflet needs `window`.

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";

function Clicker({ onPick }) {
  useMapEvents({
    click(e) {
      // worldCopyJump can hand back longitudes outside [-180,180] when the map
      // is panned across world copies — wrap() normalizes them.
      const { lat, lng } = e.latlng.wrap();
      onPick({ lat, lng });
    },
  });
  return null;
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 5), {
        duration: 1.1,
      });
    }
  }, [target, map]);
  return null;
}

function activeIcon(color) {
  return L.divIcon({
    className: "",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    html: `<span class="pin" style="--c:${color || "#ffffff"}"><span class="pin__ring"></span><span class="pin__dot"></span></span>`,
  });
}

function bloomIcon(color) {
  return L.divIcon({
    className: "",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    html: `<span class="bloom" style="--c:${color || "#888888"}"></span>`,
  });
}

function tripIcon(n) {
  return L.divIcon({
    className: "",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    html: `<span class="trip-pin">${n}</span>`,
  });
}

export default function MapCanvas({
  selected,
  onPick,
  accent,
  explored = [],
  onSelectExplored,
  stops = [],
}) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={3}
      minZoom={2}
      scrollWheelZoom
      worldCopyJump
      zoomControl={false}
      style={{ height: "100%", width: "100%", background: "#e9e6df" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; OpenStreetMap, &copy; CARTO"
        subdomains="abcd"
      />
      <ZoomControl position="bottomleft" />
      <Clicker onPick={onPick} />
      <FlyTo target={selected} />

      {explored.filter((e) => e.coords).map((e, i) => (
        <Marker
          key={`${e.coords.lat},${e.coords.lng},${i}`}
          position={[e.coords.lat, e.coords.lng]}
          icon={bloomIcon(e.accent)}
          eventHandlers={{ click: () => onSelectExplored?.(e) }}
        />
      ))}

      {stops.length > 1 && (
        <Polyline
          positions={stops.map((s) => [s.lat, s.lng])}
          pathOptions={{ color: "#1c1b19", weight: 2, opacity: 0.5, dashArray: "3 7" }}
        />
      )}
      {stops.map((s, i) => (
        <Marker key={`stop-${i}`} position={[s.lat, s.lng]} icon={tripIcon(i + 1)} />
      ))}

      {selected && stops.length === 0 && (
        <Marker position={[selected.lat, selected.lng]} icon={activeIcon(accent)} />
      )}
    </MapContainer>
  );
}
