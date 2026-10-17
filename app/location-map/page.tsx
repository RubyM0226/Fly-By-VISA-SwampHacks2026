import type { Metadata } from "next";
import { SignInGate } from "@/components/SignInGate";
import { LocationMapScreen } from "@/components/LocationMapScreen";

export const metadata: Metadata = { title: "Location Map: FlyByVisa" };

export default function LocationMapPage() {
  return (
    <SignInGate returnTo="/location-map">
      <LocationMapScreen />
    </SignInGate>
  );
}
