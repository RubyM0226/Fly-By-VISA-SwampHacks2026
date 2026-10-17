import type { Metadata } from "next";
import { DocumentsScreen } from "@/components/DocumentsScreen";
import { SignInGate } from "@/components/SignInGate";

export const metadata: Metadata = { title: "Documents: FlyByVisa" };

export default function DocumentsPage() {
  return (
    <SignInGate returnTo="/documents">
      <DocumentsScreen />
    </SignInGate>
  );
}
