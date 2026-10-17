"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { APP_NAME } from "@/lib/config";
import { useT } from "@/lib/i18n";
import { LogoIcon } from "./Icons";
import { AccessibilityBar } from "./AccessibilityBar";

/** One sticky row: logo, accessibility controls, More. Sign-in lives in the side nav. */
export function Header() {
  const { t, lang } = useT();
  const ref = useRef<HTMLElement>(null);

  // Tell the page how tall the sticky header is, so the side nav, focused
  // elements and in-page links are never hidden underneath it.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () =>
      document.documentElement.style.setProperty("--sticky-header-h", `${el.offsetHeight}px`);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <header ref={ref} className="sticky top-0 z-40" style={{ viewTransitionName: "site-header" }}>
      <AccessibilityBar
        start={
          <Link
            href="/"
            className="inline-flex min-h-12 items-center gap-2 text-xl font-bold text-accent"
            aria-label={`${APP_NAME[lang]} — ${t("nav.home")}`}
          >
            <LogoIcon className="h-7 w-7" />
            <span>{APP_NAME[lang]}</span>
          </Link>
        }
      />
    </header>
  );
}
