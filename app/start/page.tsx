import type { Metadata } from "next";
import { StartScreen } from "@/components/StartScreen";

export const metadata: Metadata = { title: "Your trip — FlyByVisa" };

export default function StartPage() {
  return <StartScreen />;
}
