"use client";

import { LINKS } from "@/lib/config";
import { useT } from "@/lib/i18n";
import { ExternalIcon } from "./Icons";

// Layered hills, after the misty-hills illustration. Decorative only.
function Hills() {
  return (
    <svg
      className="site-footer__hills"
      viewBox="0 0 1440 200"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* Teal-blue ridge on the left */}
      <path d="M0 20 L640 190 L0 200 Z" fill="var(--hill-ridge)" />
      {/* Sage hill sweeping up to the right */}
      <path d="M0 140 L1440 45 L1440 200 L0 200 Z" fill="var(--hill-sage)" />
      {/* Field furrows on the sage hill */}
      <g stroke="#ffffff" strokeOpacity="0.18" strokeWidth="2" fill="none" strokeLinecap="round">
        <path d="M960 112 C 1090 98, 1220 92, 1380 80" />
        <path d="M1030 130 C 1150 118, 1270 112, 1430 102" />
      </g>
      {/* Soft lime hill on the right */}
      <path d="M720 200 C 800 150, 900 128, 1060 126 L1440 120 L1440 200 Z" fill="var(--hill-lime)" />
      {/* Front forest hill with a rounded shoulder, where the text sits */}
      <path d="M0 162 L820 170 C 900 172, 935 188, 1000 189 L1440 187 L1440 200 L0 200 Z" fill="var(--hill-forest)" />
    </svg>
  );
}

export function Footer() {
  const { t } = useT();
  return (
    <footer className="site-footer mt-10">
      <Hills />
      <div className="site-footer__body">
        <div className="space-y-2 px-4 pb-6 pt-2 text-center text-sm sm:px-6 lg:px-8">
          <p>{t("footer.disclaimer")}</p>
          <p>{t("footer.privacy")}</p>
          <p>
            {t("footer.scam")}{" "}
            <a
              href={LINKS.fraudWarning}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center gap-1 font-semibold underline"
            >
              {t("footer.scamLink")}
              <ExternalIcon className="h-4 w-4" />
              <span className="sr-only">{t("journey.opensNewTab")}</span>
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
