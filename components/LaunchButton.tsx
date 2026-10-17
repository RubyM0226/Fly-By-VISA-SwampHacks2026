"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useSettings } from "@/lib/settings";
import { ArrowIcon, PlaneIcon } from "./Icons";
import { FORWARD } from "./ScreenTransition";

// The plane takes off for this long before the screen starts to roll.
const TAKEOFF_MS = 420;

const noop = () => () => {};
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * A Continue link that turns into a little plane and flies off before moving
 * to the next screen. With motion reduced it is an ordinary link.
 */
export function LaunchButton({
  href,
  label,
  className,
  transitionTypes = FORWARD,
  scroll = true,
}: {
  href: string;
  label: string;
  className: string;
  /** How the screens change; rolls forward unless told otherwise. */
  transitionTypes?: string[];
  /** False keeps the scroll position, as when the next screen shares this one's globe. */
  scroll?: boolean;
}) {
  const router = useRouter();
  const [settings] = useSettings();
  const systemReduce = useSyncExternalStore(noop, prefersReducedMotion, () => false);
  const reduceMotion = settings.pauseMotion || systemReduce;
  const [launching, setLaunching] = useState(false);

  // Next keeps the previous screen alive and restores it on Back. Land the
  // plane when this screen is hidden, so the button is back in place next time.
  useEffect(() => () => setLaunching(false), []);

  return (
    <Link
      href={href}
      data-button
      transitionTypes={transitionTypes}
      scroll={scroll}
      onClick={(e) => {
        if (reduceMotion) return; // plain navigation, swaps instantly
        e.preventDefault();
        if (launching) return;
        setLaunching(true);
        setTimeout(() => router.push(href, { transitionTypes, scroll }), TAKEOFF_MS);
      }}
      data-launching={launching || undefined}
      // Named so the plane keeps flying above the screens while they roll.
      style={launching ? { viewTransitionName: "launch-plane" } : undefined}
      className={`launch-btn relative ${className}`}
    >
      <span className="launch-label inline-flex items-center gap-2">
        {label}
        <ArrowIcon className="h-6 w-6" />
      </span>
      <PlaneIcon className="launch-plane-icon pointer-events-none absolute inset-0 m-auto h-10 w-10" />
    </Link>
  );
}
