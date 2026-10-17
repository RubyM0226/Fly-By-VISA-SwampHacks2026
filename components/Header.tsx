"use client";

import Link from "next/link";
import { useState } from "react";
import { APP_NAME } from "@/lib/config";
import { useT } from "@/lib/i18n";
import { AccessIcon, RouteIcon } from "./Icons";
import { LanguageToggle } from "./LanguageToggle";
import { SpeakButton } from "./SpeakButton";
import { AccessibilityPanel } from "./AccessibilityPanel";

export function Header() {
  const { t, lang } = useT();
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <header className="border-b-2 border-line bg-surface">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="inline-flex min-h-12 items-center gap-2 text-xl font-bold text-accent" aria-label={`${APP_NAME[lang]} — ${t("nav.home")}`}>
          <RouteIcon className="h-7 w-7" />
          <span>{APP_NAME[lang]}</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <LanguageToggle />
          <SpeakButton
            ownerId="page"
            label={t("nav.readAloud")}
            getText={() => document.getElementById("main-content")?.innerText ?? ""}
          />
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            aria-haspopup="dialog"
            className="inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-line-strong bg-surface px-4 py-2 font-semibold hover:bg-accent-soft"
          >
            <AccessIcon className="h-5 w-5" />
            <span>{t("nav.accessibility")}</span>
          </button>
        </div>
      </div>

      <AccessibilityPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </header>
  );
}
