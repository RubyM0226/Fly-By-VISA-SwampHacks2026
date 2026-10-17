"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { COUNTRIES, COUNTRY_BY_CODE, midpoint, type CountryCode } from "@/lib/countries";
import { useT } from "@/lib/i18n";
import { useSettings } from "@/lib/settings";
import { useSyncExternalStore } from "react";

interface Props {
  from: "" | CountryCode;
  to: "" | CountryCode;
  onPick: (code: CountryCode) => void;
}

interface Point {
  code: CountryCode;
  name: string;
  lat: number;
  lng: number;
  enabled: boolean;
  selected: boolean;
}

const noop = () => () => {};
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * The 3D globe. This is an enhancement: every choice is also available as a
 * plain list next to it, so keyboard and screen-reader users never need it.
 * (OrbitControls captures touch drags on the canvas, so keep the globe a
 * limited height and leave room around it to scroll the page.)
 */
export default function GlobeView({ from, to, onPick }: Props) {
  const { t } = useT();
  const [settings] = useSettings();
  const systemReduce = useSyncExternalStore(noop, prefersReducedMotion, () => false);
  const reduceMotion = settings.pauseMotion || systemReduce;

  const wrapRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [ready, setReady] = useState(false);

  // Fit the globe to its container.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setSize({ w: Math.round(entry.contentRect.width), h: Math.round(entry.contentRect.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const points: Point[] = useMemo(
    () =>
      COUNTRIES.map((c) => ({
        code: c.code,
        name: t(c.nameKey),
        lat: c.lat,
        lng: c.lng,
        enabled: c.origin || c.destination,
        selected: c.code === from || c.code === to,
      })),
    [t, from, to],
  );

  const arcs = useMemo(() => {
    if (!from || !to) return [];
    const a = COUNTRY_BY_CODE[from];
    const b = COUNTRY_BY_CODE[to];
    return [{ startLat: a.lat, startLng: a.lng, endLat: b.lat, endLng: b.lng }];
  }, [from, to]);

  // Spin slowly unless motion is reduced.
  useEffect(() => {
    if (!ready || !globeRef.current) return;
    const controls = globeRef.current.controls();
    controls.autoRotate = !reduceMotion && !(from && to);
    controls.autoRotateSpeed = 0.5;
    controls.enableZoom = false; // keep page scrolling with the mouse wheel
  }, [ready, reduceMotion, from, to]);

  // Turn toward whatever was just chosen.
  useEffect(() => {
    if (!ready || !globeRef.current) return;
    const ms = reduceMotion ? 0 : 900;
    if (from && to) {
      const mid = midpoint(COUNTRY_BY_CODE[from], COUNTRY_BY_CODE[to]);
      globeRef.current.pointOfView({ ...mid, altitude: 3 }, ms);
    } else if (from || to) {
      const c = COUNTRY_BY_CODE[(from || to) as CountryCode];
      globeRef.current.pointOfView({ lat: c.lat, lng: c.lng, altitude: 2.2 }, ms);
    }
  }, [ready, reduceMotion, from, to]);

  const colorOf = (d: object) => {
    const p = d as Point;
    if (p.selected) return "#ffd400";
    return p.enabled ? "#ff9f1c" : "#9aa5b1";
  };

  return (
    <div ref={wrapRef} className="h-full w-full">
      {size.w > 0 && (
        <Globe
          ref={globeRef}
          width={size.w}
          height={size.h}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="/globe/earth-blue-marble.jpg"
          atmosphereColor="#9ad7d2"
          onGlobeReady={() => setReady(true)}
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointColor={colorOf}
          pointAltitude={0.05}
          pointRadius={(d: object) => ((d as Point).enabled ? 1.1 : 0.7)}
          pointLabel={(d: object) => {
            const p = d as Point;
            return `<div style="padding:6px 10px;border-radius:8px;background:#fff;color:#1f2430;font:600 14px system-ui">${p.name}${
              p.enabled ? "" : ` · ${t("home.comingSoon")}`
            }</div>`;
          }}
          onPointClick={(d: object) => {
            const p = d as Point;
            if (p.enabled) onPick(p.code);
          }}
          labelsData={points}
          labelLat="lat"
          labelLng="lng"
          labelText={(d: object) => (d as Point).name}
          labelSize={1.3}
          labelDotRadius={0}
          labelColor={() => "#ffffff"}
          labelResolution={2}
          arcsData={arcs}
          arcColor={() => ["#ffd400", "#ffffff"]}
          arcStroke={0.7}
          arcAltitudeAutoScale={0.45}
          arcDashLength={0.4}
          arcDashGap={0.15}
          arcDashAnimateTime={reduceMotion ? 0 : 2200}
        />
      )}
    </div>
  );
}
