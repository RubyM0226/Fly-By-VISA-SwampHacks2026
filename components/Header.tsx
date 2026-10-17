"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { APP_NAME } from "@/lib/config";
import { useT } from "@/lib/i18n";
import { LogoIcon } from "./Icons";
import { AccessibilityBar } from "./AccessibilityBar";

interface UserProfile {
  name?: string;
  email?: string;
}

export function Header() {
  const { t, lang } = useT();
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

  // Sticky header height syncing
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

  const handleLogin = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.location.href = "/auth/login";
  };

  const handleLogout = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.location.href = "/auth/logout";
  };

  return (
    <header ref={ref} className="sticky top-0 z-40" style={{ viewTransitionName: "site-header" }}>
      <div className="border-b-2 border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2 sm:px-6">
          <Link href="/" className="inline-flex min-h-12 items-center gap-2 text-xl font-bold text-accent" aria-label={`${APP_NAME[lang]} — ${t("nav.home")}`}>
            <LogoIcon className="h-7 w-7" />
            <span>{APP_NAME[lang]}</span>
          </Link>

          {/* Auth0 Controls */}
{user ? (
  <div className="flex items-center gap-2">
    <span className="text-sm font-semibold text-slate-700">
      Hi, {user.name || user.email}
    </span>
    {/* Use a standard 'a' tag, NOT next/link */}
    <a
      href="/auth/logout"
      className="inline-flex min-h-10 items-center rounded-xl border-2 border-line-strong bg-surface px-3 py-1 font-semibold text-red-600 hover:bg-red-50"
    >
      Sign Out
    </a>
  </div>
) : (
  <a
    href="/auth/login"
    className="inline-flex min-h-10 items-center rounded-xl border-2 border-line-strong bg-accent px-4 py-1 font-semibold text-white hover:bg-accent/90"
  >
    Sign In
  </a>
)}
        </div>
      </div>

      <AccessibilityBar />
    </header>
  );
}