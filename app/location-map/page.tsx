import type { Metadata } from "next";
import { LocationMapScreen } from "@/components/LocationMapScreen";

export const metadata: Metadata = { title: "Location Map: FlyByVisa" };

export default function LocationMapPage() {
  return <LocationMapScreen />;
}
