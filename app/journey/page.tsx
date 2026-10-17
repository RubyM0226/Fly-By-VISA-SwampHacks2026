import type { Metadata } from "next";
import { JourneyScreen } from "@/components/JourneyScreen";
import { ScreenTransition } from "@/components/ScreenTransition";

export const metadata: Metadata = { title: "Your journey — FlyByVisa" };

export default function JourneyPage() {
  return (
    <ScreenTransition>
      <JourneyScreen />
    </ScreenTransition>
  );
}
