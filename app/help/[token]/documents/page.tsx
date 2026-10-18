import { getJourneyByHelperToken } from "@/app/actions/helper";
import { DocumentsScreen } from "@/components/DocumentsScreen";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

async function HelperDocumentsContent({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  const { valid, journey } = await getJourneyByHelperToken(token);
  // The shared-plan page already explains an expired or revoked link.
  if (!valid) redirect(`/help/${token}`);
  return <DocumentsScreen helperToken={token} home={journey?.profile?.from} />;
}

export default function HelperDocumentsPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Suspense fallback={null}>
      <HelperDocumentsContent params={params} />
    </Suspense>
  );
}
