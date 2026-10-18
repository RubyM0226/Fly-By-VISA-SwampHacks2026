"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { useT } from "@/lib/i18n";
import type { CountryCode } from "@/lib/countries";

// three.js is large, so load it only in the browser and only when needed.
const GlobeView = dynamic(() => import("./GlobeView"), {
  ssr: false,
  loading: () => <GlobePlaceholder />,
});

function GlobePlaceholder() {
  const { t } = useT();
  return (
    <div className="flex h-full items-center justify-center text-white/90">
      <p>{t("home.globeLoading")}</p>
    </div>
  );
}

let webglCache: boolean | undefined;
function supportsWebGL() {
  if (webglCache === undefined) {
    try {
      const c = document.createElement("canvas");
      webglCache = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      webglCache = false;
    }
  }
  return webglCache;
}
const noop = () => () => {};

/** False on devices without WebGL; the page then hides the globe and keeps the lists. */
export function useSupportsWebGL(): boolean {
  return useSyncExternalStore(noop, supportsWebGL, () => true);
}

interface Props {
  from: "" | CountryCode;
  to: "" | CountryCode;
  onPick: (code: CountryCode) => void;
  /** Camera zoom; 1 is the normal view, larger is closer. */
  zoom: number;
  /** Landing page: decorative. Drag to spin only; no route, pins, labels or picking. */
  landing: boolean;
}

export function GlobeLoader(props: Props) {
  return <GlobeView {...props} />;
}
