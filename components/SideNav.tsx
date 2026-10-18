"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT, type UiKey } from "@/lib/i18n";
import { useProfile } from "@/lib/useProfile";
import { BookIcon, DocumentIcon, MapIcon, PlaneIcon, PlanIcon, SearchIcon, ShieldIcon, UserIcon } from "./Icons";

type IconType = (props: { className?: string }) => React.ReactElement;

// Narrow screens: a square icon button (the label stays for screen readers and
// as a tooltip). Tablets and up: icon and label side by side.
const itemClass = (active: boolean) =>
  `flex min-h-[48px] items-center justify-center rounded-xl p-[8px] font-semibold leading-tight md:min-h-14 md:justify-start md:gap-2 md:px-2.5 md:text-base ${
    active ? "bg-accent text-accent-ink" : "text-ink hover:bg-accent-soft"
  }`;
const labelClass = "sr-only md:not-sr-only";

/** A caregiver's home (/help/[token]) when on a helper-link page, else null. */
export function helperHome(pathname: string): string | null {
  const m = /^\/help\/([^/]+)/.exec(pathname);
  return m ? `/help/${m[1]}` : null;
}

function NavItem({ href, label, Icon, active }: { href: string; label: string; Icon: IconType; active: boolean }) {
  return (
    <li>
      <Link href={href} title={label} aria-current={active ? "page" : undefined} className={itemClass(active)}>
        <Icon className="h-6 w-6 shrink-0" />
        <span className={labelClass}>{label}</span>
      </Link>
    </li>
  );
}

/**
 * Always-visible navigation in a column on the left, under the header: a
 * narrow icon rail on phones, icons with labels from tablets up. The current
 * page is highlighted.
 */
export function SideNav() {
  const { t } = useT();
  const pathname = usePathname();
  const user = useProfile();

  // The landing page has no nav, so it and its footer hills use the full
  // width. The shared globe still leaves the nav's room (see .globe-stage).
  if (pathname === "/") return null;

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const navClass =
    "sticky top-[var(--sticky-header-h,0px)] z-30 h-[calc(100dvh-var(--sticky-header-h,0px))] w-[64px] shrink-0 flex flex-col overflow-y-auto border-r-2 border-line bg-surface md:w-48";
  const listClass = "flex shrink-0 flex-col gap-2 p-[8px] md:p-2";

  // Caregivers on a helper link get their own token-scoped nav: never the
  // traveler's Dashboard, Account or sign-in, even if this browser is signed in.
  const home = helperHome(pathname);
  if (home) {
    return (
      <nav aria-label={t("nav.main")} className={navClass}>
        <ul className={listClass}>
          <NavItem href={home} label={t("nav.sharedPlan")} Icon={PlanIcon} active={pathname === home} />
          {/* Phase 1B: the caregiver "Documents" item goes here. */}
        </ul>
        <ul className={`mt-auto ${listClass}`}>
          <NavItem href={`${home}/account`} label={t("nav.account")} Icon={UserIcon} active={isActive(`${home}/account`)} />
        </ul>
      </nav>
    );
  }

  const item = (href: string, label: UiKey, Icon: IconType) => (
    <NavItem href={href} label={t(label)} Icon={Icon} active={isActive(href)} />
  );

  return (
    <nav aria-label={t("nav.main")} className={navClass}>
      <ul className={listClass}>
        {user ? (
          item("/journey", "nav.dashboard", PlanIcon)
        ) : (
          <li>
            {/* Auth0's login page also offers sign up. It needs a full page load, not a client-side Link. */}
            <a href={`/auth/login?returnTo=${encodeURIComponent(pathname)}`} title={t("nav.login")} className={itemClass(false)}>
              <UserIcon className="h-6 w-6 shrink-0" />
              <span className={labelClass}>{t("nav.login")}</span>
            </a>
          </li>
        )}
        {item("/location-map", "nav.map", MapIcon)}
        {item("/flights", "nav.flights", PlaneIcon)}
        {item("/information-lookup", "nav.infoLookup", SearchIcon)}
        {item("/documents", "nav.documents", DocumentIcon)}
        {item("/glossary", "nav.glossary", BookIcon)}
        {item("/scam-check", "nav.scam", ShieldIcon)}
      </ul>
      {user && <ul className={`mt-auto ${listClass}`}>{item("/account", "nav.account", UserIcon)}</ul>}
    </nav>
  );
}
