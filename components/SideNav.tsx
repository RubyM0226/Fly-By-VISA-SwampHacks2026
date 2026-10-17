"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT, type UiKey } from "@/lib/i18n";
import { useProfile } from "@/lib/useProfile";
import { DocumentIcon, MapIcon, PlanIcon, UserIcon } from "./Icons";

type IconType = (props: { className?: string }) => React.ReactElement;

const itemClass = (active: boolean) =>
  `flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-center text-sm font-semibold leading-tight md:flex-none md:flex-row md:justify-start md:gap-3 md:px-3 md:text-left md:text-base ${
    active ? "bg-accent text-accent-ink" : "text-ink hover:bg-accent-soft"
  }`;

function NavItem({ href, label, Icon, active }: { href: string; label: string; Icon: IconType; active: boolean }) {
  return (
    <li className="flex md:block">
      <Link href={href} aria-current={active ? "page" : undefined} className={itemClass(active)}>
        <Icon className="h-6 w-6 shrink-0" />
        <span>{label}</span>
      </Link>
    </li>
  );
}

/**
 * Always-visible navigation: a column on the left under the header on tablets
 * and up, a bar along the bottom on phones. The current page is highlighted.
 */
export function SideNav() {
  const { t } = useT();
  const pathname = usePathname();
  const user = useProfile();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const item = (href: string, label: UiKey, Icon: IconType) => (
    <NavItem href={href} label={t(label)} Icon={Icon} active={isActive(href)} />
  );

  return (
    <nav
      aria-label={t("nav.main")}
      className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-line bg-surface md:sticky md:top-[var(--sticky-header-h,0px)] md:bottom-auto md:h-[calc(100dvh-var(--sticky-header-h,0px))] md:w-56 md:shrink-0 md:overflow-y-auto md:border-r-2 md:border-t-0"
    >
      <ul className="flex gap-1 p-1.5 md:flex-col md:gap-2 md:p-3">
        {user ? (
          item("/my-plan", "nav.myPlan", PlanIcon)
        ) : (
          <li className="flex md:block">
            {/* Auth0's login page also offers sign up. It needs a full page load, not a client-side Link. */}
            <a href={`/auth/login?returnTo=${encodeURIComponent(pathname)}`} className={itemClass(false)}>
              <UserIcon className="h-6 w-6 shrink-0" />
              <span>{t("nav.login")}</span>
            </a>
          </li>
        )}
        {item("/location-map", "nav.map", MapIcon)}
        {item("/documents", "nav.documents", DocumentIcon)}
      </ul>
    </nav>
  );
}
