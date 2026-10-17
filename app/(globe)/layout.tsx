import { GlobeStage } from "@/components/GlobeStage";
import { ScreenTransition } from "@/components/ScreenTransition";

/**
 * The landing page and the country picker share this layout, so they share
 * one globe: moving between them keeps it in place and only swaps the box
 * beside it. Leaving for another screen rolls the whole stage away.
 */
export default function GlobeLayout({ children }: { children: React.ReactNode }) {
  return (
    <ScreenTransition>
      <GlobeStage>{children}</GlobeStage>
    </ScreenTransition>
  );
}
