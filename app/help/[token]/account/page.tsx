import { getJourneyByHelperToken } from "@/app/actions/helper";
import { HelperAccountScreen } from "@/components/HelperAccountScreen";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

async function HelperAccountContent({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  const { valid } = await getJourneyByHelperToken(token);
  // The shared-plan page already explains an expired or revoked link.
  if (!valid) redirect(`/help/${token}`);
  return <HelperAccountScreen />;
}

export default function HelperAccountPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Suspense fallback={null}>
      <HelperAccountContent params={params} />
    </Suspense>
  );
}
