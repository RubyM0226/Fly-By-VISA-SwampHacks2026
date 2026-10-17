import type { Metadata } from "next";
import { StartScreen } from "@/components/StartScreen";
import { ScreenTransition } from "@/components/ScreenTransition";

export const metadata: Metadata = { title: "Your trip — FlyByVisa" };

export default function StartPage() {
  return (
    <ScreenTransition>
      <StartScreen />
    </ScreenTransition>
  );
}
