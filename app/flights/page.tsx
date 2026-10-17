import type { Metadata } from "next";
import { FlightsScreen } from "@/components/FlightsScreen";
import { ScreenTransition } from "@/components/ScreenTransition";

export const metadata: Metadata = { title: "Find your flight — FlyByVisa" };

export default function FlightsPage() {
  return (
    <ScreenTransition>
      <FlightsScreen />
    </ScreenTransition>
  );
}
