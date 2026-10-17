import type { Metadata } from "next";
import { GlossaryScreen } from "@/components/GlossaryScreen";

export const metadata: Metadata = { title: "Glossary: FlyByVisa" };

export default function GlossaryPage() {
  return <GlossaryScreen />;
}
