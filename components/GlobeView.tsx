"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import * as THREE from "three";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import worldTopo from "world-atlas/countries-110m.json";
import { COUNTRIES, COUNTRY_BY_CODE, COUNTRY_BY_MAP_ID, midpoint, type CountryCode } from "@/lib/countries";
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

interface Shape {
  id?: string | number;
  properties: { name: string };
}

// Flat, cartoon palette from the misty-hills design system.
const COLORS = {
  ocean: "#7fb3c6",
  land: "#c3d8b1",
  landAvailable: "#86b592",
  landSelected: "#3f7d62",
  landHover: "#d6e09f",
  side: "#6f9a7c",
  border: "#f4f8f2",
  pinSelected: "#f2b84b",
  pinAvailable: "#285d4a",
  pinSoon: "#8a9ea3",
  label: "#1b2b30",
  arc: ["#f2b84b", "#ffffff"],
};

// Arc shape, shared with the plane so it flies exactly along the line.
const ARC_ALT_SCALE = 0.45;
const FLIGHT_MS = 4500;
const PAUSE_MS = 1200;

const SHAPES = feature(
  worldTopo as unknown as Topology,
  (worldTopo as unknown as Topology).objects.countries as GeometryCollection,
).features as unknown as Shape[];

const noop = () => () => {};
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function toVec(lat: number, lng: number) {
  const phi = (lat * Math.PI) / 180;
  const lambda = (lng * Math.PI) / 180;
  return new THREE.Vector3(Math.cos(phi) * Math.cos(lambda), Math.cos(phi) * Math.sin(lambda), Math.sin(phi));
}

/** Point a fraction t along the great circle between a and b, as lat/lng. */
function interpolate(a: THREE.Vector3, b: THREE.Vector3, angle: number, t: number) {
  const v = a
    .clone()
    .multiplyScalar(Math.sin((1 - t) * angle))
    .add(b.clone().multiplyScalar(Math.sin(t * angle)))
    .divideScalar(Math.sin(angle));
  return { lat: (Math.asin(v.z) * 180) / Math.PI, lng: (Math.atan2(v.y, v.x) * 180) / Math.PI };
}

/** A small, friendly plane. Nose points along +Z, top along +Y. */
function makePlane() {
  const body = new THREE.MeshLambertMaterial({ color: "#ffffff" });
  const trim = new THREE.MeshLambertMaterial({ color: "#285d4a" });
  const plane = new THREE.Group();

  const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(0.9, 4, 4, 12), body);
  fuselage.rotation.x = Math.PI / 2;
  plane.add(fuselage);

  const wings = new THREE.Mesh(new THREE.BoxGeometry(7, 0.25, 1.6), trim);
  wings.position.set(0, 0, 0.3);
  plane.add(wings);

  const tailplane = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.2, 0.8), trim);
  tailplane.position.set(0, 0, -2.3);
  plane.add(tailplane);

  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.6, 1), trim);
  fin.position.set(0, 0.9, -2.3);
  plane.add(fin);

  plane.scale.setScalar(2);
  return plane;
}

/**
 * The 3D globe. This is an enhancement: every choice is also available in the
 * dropdowns above it, so keyboard and screen-reader users never need it.
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
  const [hover, setHover] = useState<Shape | null>(null);

  // Next keeps this page alive in the background after you move on, which tears
  // down effects: react-globe.gl then destroys its renderer and scene, and on
  // return it re-attaches that destroyed instance, leaving an empty box. So
  // whenever we are torn down, ask for a brand-new globe for next time.
  const [instance, setInstance] = useState(0);
  useEffect(
    () => () => {
      setReady(false);
      setInstance((n) => n + 1);
    },
    [],
  );

  const globeMaterial = useMemo(() => new THREE.MeshLambertMaterial({ color: COLORS.ocean }), []);

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
      globeRef.current.pointOfView({ ...mid, altitude: 2.2 }, ms);
    } else if (from || to) {
      const c = COUNTRY_BY_CODE[(from || to) as CountryCode];
      globeRef.current.pointOfView({ lat: c.lat, lng: c.lng, altitude: 1.9 }, ms);
    }
  }, [ready, reduceMotion, from, to]);

  // A small plane flies the arc from origin to destination, then starts again.
  // With motion paused it waits halfway along the route instead.
  useEffect(() => {
    const globe = globeRef.current;
    if (!ready || !globe || !from || !to) return;
    const a = COUNTRY_BY_CODE[from];
    const b = COUNTRY_BY_CODE[to];
    const va = toVec(a.lat, a.lng);
    const vb = toVec(b.lat, b.lng);
    const angle = va.angleTo(vb);
    if (angle === 0) return;

    // Same cubic curve three-globe draws for the arc.
    const alt = (angle / 2) * ARC_ALT_SCALE;
    const at = (lat: number, lng: number, h: number) => {
      const c = globe.getCoords(lat, lng, h);
      return new THREE.Vector3(c.x, c.y, c.z);
    };
    const m1 = interpolate(va, vb, angle, 0.25);
    const m2 = interpolate(va, vb, angle, 0.75);
    const curve = new THREE.CubicBezierCurve3(
      at(a.lat, a.lng, 0),
      at(m1.lat, m1.lng, alt * 1.5),
      at(m2.lat, m2.lng, alt * 1.5),
      at(b.lat, b.lng, 0),
    );

    const plane = makePlane();
    const place = (progress: number) => {
      const pos = curve.getPointAt(progress);
      const ahead = pos.clone().add(curve.getTangentAt(progress));
      plane.position.copy(pos);
      plane.up.copy(pos).normalize();
      plane.lookAt(ahead);
    };

    const scene = globe.scene();
    scene.add(plane);

    let frame = 0;
    if (reduceMotion) {
      place(0.5);
    } else {
      const start = performance.now();
      const tick = (now: number) => {
        const elapsed = (now - start) % (FLIGHT_MS + PAUSE_MS);
        const progress = Math.min(elapsed / FLIGHT_MS, 1);
        // Ease in and out so take-off and landing feel gentle.
        place(0.02 + 0.96 * (0.5 - Math.cos(Math.PI * progress) / 2));
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(frame);
      scene.remove(plane);
      plane.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
    };
  }, [ready, reduceMotion, from, to]);

  const countryOf = (d: object) => {
    const id = (d as Shape).id;
    return id === undefined ? undefined : COUNTRY_BY_MAP_ID[String(id).padStart(3, "0")];
  };

  const shapeColor = (d: object) => {
    const c = countryOf(d);
    if (c && (c.code === from || c.code === to)) return COLORS.landSelected;
    if (d === hover && c && (c.origin || c.destination)) return COLORS.landHover;
    if (c && (c.origin || c.destination)) return COLORS.landAvailable;
    return COLORS.land;
  };

  const shapeAltitude = (d: object) => {
    const c = countryOf(d);
    if (c && (c.code === from || c.code === to)) return 0.03;
    if (d === hover && c && (c.origin || c.destination)) return 0.03;
    if (c && (c.origin || c.destination)) return 0.018;
    return 0.008;
  };

  const tooltip = (name: string, enabled: boolean) =>
    `<div style="padding:6px 10px;border-radius:8px;background:#fff;color:${COLORS.label};font:600 14px system-ui">${name}${
      enabled ? "" : ` · ${t("home.comingSoon")}`
    }</div>`;

  const colorOf = (d: object) => {
    const p = d as Point;
    if (p.selected) return COLORS.pinSelected;
    return p.enabled ? COLORS.pinAvailable : COLORS.pinSoon;
  };

  return (
    <div ref={wrapRef} className="h-full w-full">
      {size.w > 0 && (
        <Globe
          key={instance}
          ref={globeRef}
          width={size.w}
          height={size.h}
          backgroundColor="rgba(0,0,0,0)"
          globeMaterial={globeMaterial}
          showGraticules={false}
          atmosphereColor="#eef6f7"
          atmosphereAltitude={0.12}
          onGlobeReady={() => setReady(true)}
          polygonsData={SHAPES}
          polygonCapColor={shapeColor}
          polygonSideColor={() => COLORS.side}
          polygonStrokeColor={() => COLORS.border}
          polygonAltitude={shapeAltitude}
          polygonsTransitionDuration={reduceMotion ? 0 : 300}
          polygonLabel={(d: object) => {
            const c = countryOf(d);
            if (c) return tooltip(t(c.nameKey), c.origin || c.destination);
            return tooltip((d as Shape).properties.name, false);
          }}
          onPolygonHover={(d: object | null) => setHover((d as Shape) ?? null)}
          onPolygonClick={(d: object) => {
            const c = countryOf(d);
            if (c && (c.origin || c.destination)) onPick(c.code);
          }}
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointColor={colorOf}
          pointAltitude={0.08}
          pointRadius={(d: object) => ((d as Point).enabled ? 1.1 : 0.7)}
          pointLabel={(d: object) => {
            const p = d as Point;
            return tooltip(p.name, p.enabled);
          }}
          onPointClick={(d: object) => {
            const p = d as Point;
            if (p.enabled) onPick(p.code);
          }}
          labelsData={points}
          labelLat="lat"
          labelLng="lng"
          labelAltitude={0.04}
          labelText={(d: object) => (d as Point).name}
          labelSize={1.3}
          labelDotRadius={0}
          labelColor={() => COLORS.label}
          labelResolution={2}
          arcsData={arcs}
          arcColor={() => COLORS.arc}
          arcStroke={0.7}
          arcAltitudeAutoScale={ARC_ALT_SCALE}
          arcDashLength={0.4}
          arcDashGap={0.15}
          arcDashAnimateTime={reduceMotion ? 0 : 2200}
        />
      )}
    </div>
  );
}
