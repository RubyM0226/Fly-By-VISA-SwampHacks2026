import type { Metadata } from "next";
import { LocationMapScreen } from "@/components/LocationMapScreen";

export const metadata: Metadata = { title: "Office Map: FlyByVisa" };

// Open to everyone: the trip comes from this browser's tripStore.
export default function LocationMapPage() {
  return <LocationMapScreen />;
}
