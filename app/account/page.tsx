import type { Metadata } from "next";
import { AccountScreen } from "@/components/AccountScreen";

export const metadata: Metadata = { title: "Account: FlyByVisa" };

export default function AccountPage() {
  return <AccountScreen />;
}
