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
        <main id="main-content" tabIndex={-1} className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 outline-none">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
