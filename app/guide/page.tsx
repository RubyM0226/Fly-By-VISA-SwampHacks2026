import type { Metadata } from "next";
import { GuideScreen } from "@/components/guide/GuideScreen";

export const metadata: Metadata = { title: "Help: FlyByVisa" };

/** The Help page. Open to everyone, signed in or not. */
export default function GuidePage() {
  return <GuideScreen />;
}
