"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { APP_NAME } from "@/lib/config";
import { useT } from "@/lib/i18n";
import { LogoIcon } from "./Icons";
import { AccessibilityBar } from "./AccessibilityBar";
import { helperHome } from "./SideNav";

function LogoLink({ compact, href }: { compact: boolean; href: string }) {
  const { t, lang } = useT();
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 items-center gap-2 whitespace-nowrap text-xl font-bold text-accent"
      aria-label={`${APP_NAME[lang]}, ${t("nav.home")}`}
    >
      <LogoIcon className="h-7 w-7 shrink-0" />
      {/* On the narrowest screens only the icon shows. */}
      {!compact && <span>{APP_NAME[lang]}</span>}
    </Link>
  );
}

// Caregivers go back to the shared plan, never to the traveler's pages.
function HomeLink({ compact }: { compact: boolean }) {
  return <LogoLink compact={compact} href={helperHome(usePathname()) ?? "/"} />;
}

interface UserProfile {
  name?: string;
  email?: string;
}

/** One sticky row: logo, accessibility controls, Auth0 controls. */
export function Header() {
  const ref = useRef<HTMLElement>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Fetch Auth0 session profile
  useEffect(() => {
    let isMounted = true;
    fetch("/auth/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data) setUser(data);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

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
        start={(compact) => (
          <Suspense fallback={<LogoLink compact={compact} href="/" />}>
            <HomeLink compact={compact} />
          </Suspense>
        )}
      />
    </header>
  );
}