import type { Metadata } from "next";
import { JourneyScreen } from "@/components/JourneyScreen";
import { ScreenTransition } from "@/components/ScreenTransition";

export const metadata: Metadata = { title: "Your journey: FlyByVisa" };

export default function JourneyPage() {
  return (
    <ScreenTransition>
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">

        
        {/* Your existing UI */}
        <JourneyScreen />
      </div>
    </ScreenTransition>
  );
}