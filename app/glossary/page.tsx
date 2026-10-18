import type { Metadata } from "next";
import { GlossaryScreen } from "@/components/GlossaryScreen";

export const metadata: Metadata = { title: "Glossary: FlyByVisa" };

/** The Glossary page. Open to everyone, signed in or not. */
export default function GlossaryPage() {
  return <GlossaryScreen />;
}
