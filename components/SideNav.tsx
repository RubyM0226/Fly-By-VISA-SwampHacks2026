"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT, type UiKey } from "@/lib/i18n";
import { useProfile } from "@/lib/useProfile";
import { BookIcon, DocumentIcon, MapIcon, PlaneIcon, PlanIcon, UserIcon } from "./Icons";
import { ScamCheckNav } from "./ScamCheck";

type IconType = (props: { className?: string }) => React.ReactElement;

// Narrow screens: a square icon button (the label stays for screen readers and
// as a tooltip). Tablets and up: icon and label side by side.
const itemClass = (active: boolean) =>
  `flex min-h-[48px] items-center justify-center rounded-xl p-[8px] font-semibold leading-tight md:min-h-14 md:justify-start md:gap-3 md:px-3 md:text-base ${
    active ? "bg-accent text-accent-ink" : "text-ink hover:bg-accent-soft"
  }`;
const labelClass = "sr-only md:not-sr-only";

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

  // The landing page has no nav. Keep its width from tablets up, so the
  // landing globe sits where the country picker's globe does.
  if (pathname === "/") return <div aria-hidden="true" className="hidden shrink-0 md:block md:w-56 lg:w-1/4" />;

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const item = (href: string, label: UiKey, Icon: IconType) => (
    <NavItem href={href} label={t(label)} Icon={Icon} active={isActive(href)} />
  );

  return (
    <nav
      aria-label={t("nav.main")}
      className="sticky top-[var(--sticky-header-h,0px)] z-30 h-[calc(100dvh-var(--sticky-header-h,0px))] w-[64px] shrink-0 flex flex-col overflow-y-auto border-r-2 border-line bg-surface md:w-56 lg:w-1/4"
    >
      <ul className="flex shrink-0 flex-col gap-2 p-[8px] md:p-3">
        {user ? (
          item("/my-plan", "nav.myPlan", PlanIcon)
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
        {item("/documents", "nav.documents", DocumentIcon)}
        {item("/glossary", "nav.glossary", BookIcon)}
      </ul>
      {/* Scam Check fills the space under the links (an icon that opens it on phones). */}
      <ScamCheckNav />
    </nav>
  );
}
