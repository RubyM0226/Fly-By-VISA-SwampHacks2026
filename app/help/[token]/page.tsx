import { getJourneyByHelperToken } from "@/app/actions/helper";
import { HelperLinkExpired, HelperLoading, HelperPlanScreen } from "@/components/HelperPlanScreen";
import { connection } from "next/server";
import { Suspense } from "react";

// Server part: the token check and the shared data. The text lives in the
// client components, so the caregiver view follows the language picker.
async function HelperContent({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const resolvedParams = await params;
  const { valid, journey } = await getJourneyByHelperToken(resolvedParams.token);

  if (!valid || !journey) return <HelperLinkExpired />;
  return <HelperPlanScreen journey={{ profile: journey.profile ?? null, stop_status: journey.stop_status ?? null }} />;
}

export default function HelperPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Suspense fallback={<HelperLoading />}>
      <HelperContent params={params} />
    </Suspense>
  );
}
