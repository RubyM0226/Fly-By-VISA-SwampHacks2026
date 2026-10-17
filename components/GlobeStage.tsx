"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { COUNTRY_BY_CODE, type CountryCode } from "@/lib/countries";
import { useT } from "@/lib/i18n";
import { tripStore, useTrip } from "@/lib/trip";
import { GlobeLoader, useSupportsWebGL } from "./GlobeLoader";
import { MinusIcon, PlusIcon } from "./Icons";

// Globe zoom steps; 1 is the globe's own framing. Starts one step in so the
// globe fills its space.
export const ZOOM_LEVELS = [0.8, 1, 1.25, 1.5, 1.75, 2];
export const DEFAULT_ZOOM = 2;
const MAX_ZOOM = ZOOM_LEVELS.length - 1;

// aria-disabled, not disabled, so keyboard focus stays on the button at the limit.
const zoomButton =
  "inline-flex h-12 w-12 items-center justify-center rounded-xl border-2 border-line-strong bg-surface shadow hover:bg-accent-soft aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-surface";

/** Choose a place from the globe or a list. */
export function pickPlace(code: CountryCode) {
  const c = COUNTRY_BY_CODE[code];
  if (c.origin) tripStore.set({ from: code as "IN" });
  else if (c.destination) tripStore.set({ to: code as "US" });
}

/**
 * One globe shared by the landing page and the country picker (it lives in
 * their shared layout), so "Get started" never moves or reloads it. The box
 * beside it (`children`) is what changes: the about box, then the country
 * card. On the landing page the globe only turns on its own; on the picker it
 * can be dragged, clicked and zoomed. Layout is in globals.css (.globe-stage).
 */
export function GlobeStage({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  const [trip] = useTrip();
  const webgl = useSupportsWebGL();
  const [zoomStep, setZoomStep] = useState(DEFAULT_ZOOM);
  const interactive = usePathname() !== "/";

  // The hint under the globe takes room from it on wide screens. Its height
  // depends on language and text size, so measure it.
  const stageRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const hint = hintRef.current;
    if (!stage || !hint) return;
    const sync = () => stage.style.setProperty("--hint-h", `${hint.offsetHeight}px`);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(hint);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={stageRef} data-hills-peek data-nav={interactive || undefined} className="globe-stage">
      <div className="globe-stage__slot">
        <div className="globe-stage__box">{children}</div>
      </div>

      {/* Globe, its zoom buttons and the hint below it, as one group. On the
          landing page the zoom buttons and hint keep their room but are
          hidden, so the globe is the same size on both screens. */}
      <div className="globe-stage__slot globe-stage__slot--globe">
        <div className="globe-stage__globe flex flex-col items-center gap-2">
          {webgl && (
            <div className="relative w-full">
              {/* Decorative on the landing page: it ignores the pointer there. */}
              <div
                {...(interactive
                  ? { role: "img", "aria-label": t("home.globeLabel") }
                  : { "aria-hidden": true })}
                className={`aspect-square w-full ${interactive ? "" : "pointer-events-none select-none"}`}
              >
                <GlobeLoader from={trip.from} to={trip.to} onPick={pickPlace} zoom={ZOOM_LEVELS[zoomStep]} />
              </div>
              <div
                role="group"
                aria-label={t("home.zoom")}
                className={`globe-stage__zoom flex justify-end gap-2 ${interactive ? "" : "invisible"}`}
              >
                <button
                  type="button"
                  onClick={() => setZoomStep((s) => Math.min(s + 1, MAX_ZOOM))}
                  aria-disabled={zoomStep === MAX_ZOOM}
                  aria-label={t("home.zoomIn")}
                  title={t("home.zoomIn")}
                  className={zoomButton}
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomStep((s) => Math.max(s - 1, 0))}
                  aria-disabled={zoomStep === 0}
                  aria-label={t("home.zoomOut")}
                  title={t("home.zoomOut")}
                  className={zoomButton}
                >
                  <MinusIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
          <p
            ref={hintRef}
            className={`globe-stage__hint max-w-prose rounded-xl bg-surface px-3 py-2 text-center text-sm text-muted shadow ${
              interactive ? "" : "invisible"
            }`}
          >
            {webgl && <>{t("home.globeHint")} </>}
            {t("home.scope")}
          </p>
        </div>
      </div>
    </div>
  );
}
