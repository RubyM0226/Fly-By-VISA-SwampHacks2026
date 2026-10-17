import type { Metadata } from "next";
import { SignInGate } from "@/components/SignInGate";
import { GlossaryScreen } from "@/components/GlossaryScreen";

export const metadata: Metadata = { title: "Glossary: FlyByVisa" };

export default function GlossaryPage() {
  return (
    <SignInGate returnTo="/glossary">
      <GlossaryScreen />
    </SignInGate>
  );
}
