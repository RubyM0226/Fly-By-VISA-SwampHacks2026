import type { Metadata } from "next";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";
import { SignInGate } from "@/components/SignInGate";

export const metadata: Metadata = { title: "Documents: FlyByVisa" };

// Placeholder: the uploads tab comes in the next phase.
export default function DocumentsPage() {
  return (
    <SignInGate returnTo="/documents">
      <PlaceholderScreen title="nav.documents" />
    </SignInGate>
  );
}
