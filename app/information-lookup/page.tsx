import type { Metadata } from "next";
import { InformationLookupScreen } from "@/components/InformationLookupScreen";
import { SignInGate } from "@/components/SignInGate";

export const metadata: Metadata = { title: "Information Lookup: FlyByVisa" };

export default function InformationLookupPage() {
  return (
    <SignInGate returnTo="/information-lookup">
      <InformationLookupScreen />
    </SignInGate>
  );
}
