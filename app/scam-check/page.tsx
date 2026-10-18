import type { Metadata } from "next";
import { ScamCheckScreen } from "@/components/ScamCheck";

export const metadata: Metadata = { title: "Scam Check: FlyByVisa" };

// Always open: no sign-in needed.
export default function ScamCheckPage() {
  return <ScamCheckScreen />;
}
