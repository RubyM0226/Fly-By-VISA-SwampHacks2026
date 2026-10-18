import { getJourneyByHelperToken } from "@/app/actions/helper";
import { GuideScreen } from "@/components/guide/GuideScreen";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

// The caregiver's Help page: only what a caregiver can use, with the shared
// journey's own dates in "Understanding your plan status".
async function HelperGuideContent({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  const { valid, journey } = await getJourneyByHelperToken(token);
  // The shared-plan page already explains an expired or revoked link.
  if (!valid || !journey) redirect(`/help/${token}`);
  return <GuideScreen shared={{ profile: journey.profile ?? null, stop_status: journey.stop_status ?? null }} />;
}

export default function HelperGuidePage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Suspense fallback={null}>
      <HelperGuideContent params={params} />
    </Suspense>
  );
}
