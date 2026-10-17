import type { Metadata } from "next";
import { MyPlanScreen } from "@/components/MyPlanScreen";

export const metadata: Metadata = { title: "My Plan — FlyByVisa" };

export default function MyPlanPage() {
  return <MyPlanScreen />;
}
