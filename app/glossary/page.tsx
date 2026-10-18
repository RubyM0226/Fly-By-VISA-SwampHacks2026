import type { Metadata } from "next";
import { GlossaryScreen } from "@/components/GlossaryScreen";

export const metadata: Metadata = { title: "Terminology: FlyByVisa" };

/** The Terminology page. Open to everyone, signed in or not. */
export default function GlossaryPage() {
  return <GlossaryScreen />;
}
