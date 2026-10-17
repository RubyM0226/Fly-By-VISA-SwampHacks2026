import type { Metadata } from "next";
import { JourneyScreen } from "@/components/JourneyScreen";

export const metadata: Metadata = { title: "Your journey — Saathi" };

export default function JourneyPage() {
  return <JourneyScreen />;
}
