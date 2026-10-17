"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { APP_NAME } from "@/lib/config";
import { useT } from "@/lib/i18n";
import { LogoIcon } from "./Icons";
import { AccessibilityBar } from "./AccessibilityBar";

export function Header() {
  const { t, lang } = useT();
  const ref = useRef<HTMLElement>(null);

  // Tell the page how tall the sticky header is, so focused elements and
  // in-page links are never hidden underneath it.
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
      <div className="border-b-2 border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center px-4 py-2 sm:px-6">
          <Link href="/" className="inline-flex min-h-12 items-center gap-2 text-xl font-bold text-accent" aria-label={`${APP_NAME[lang]} — ${t("nav.home")}`}>
            <LogoIcon className="h-7 w-7" />
            <span>{APP_NAME[lang]}</span>
          </Link>
        </div>
      </div>

      <AccessibilityBar />
    </header>
  );
}
