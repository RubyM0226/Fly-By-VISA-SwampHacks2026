import type { Metadata } from "next";
import { DocumentsScreen } from "@/components/DocumentsScreen";

export const metadata: Metadata = { title: "Important Documents — FlyByVisa" };

export default function DocumentsPage() {
  return <DocumentsScreen />;
}
