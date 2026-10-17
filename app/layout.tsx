import type { Metadata } from "next";
import "@fontsource-variable/noto-sans";
import "@fontsource-variable/noto-sans-devanagari";
import "@fontsource/opendyslexic/400.css";
import "@fontsource/opendyslexic/700.css";
import "./globals.css";
import { PRE_HYDRATION_SCRIPT } from "@/lib/settingsScript";
import { SettingsSync } from "@/components/SettingsSync";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SkipLink } from "@/components/SkipLink";
import { SideNav } from "@/components/SideNav";

export const metadata: Metadata = {
  title: "FlyByVisa — your step-by-step path to the U.S.",
  description:
    "A calm, accessible planner for visiting family in the United States. Available in English and Hindi.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the pre-hydration script sets lang and data-* on <html>.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PRE_HYDRATION_SCRIPT }} />
      </head>
      <body className="min-h-screen flex flex-col bg-bg text-ink font-sans">
        <SettingsSync />
        <SkipLink />
        <Header />
        {/* Nav on the left (an icon rail on narrow screens); the page and footer fill the rest. */}
        <div className="flex flex-1">
          <SideNav />
          <div className="@container flex min-w-0 flex-1 flex-col">
            <main id="main-content" tabIndex={-1} className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-10 outline-none">
              {children}
            </main>
            <Footer />
          </div>
        </div>
      </body>
    </html>
  );
}
