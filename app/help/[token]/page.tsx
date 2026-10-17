import { getJourneyByHelperToken, updateHelperProgress } from "@/app/actions/helper";
import { formatDate } from "@/lib/journey";
import { connection } from "next/server";
import { Suspense } from "react";

async function HelperContent({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const resolvedParams = await params;
  const { valid, journey, label } = await getJourneyByHelperToken(resolvedParams.token);

  if (!valid || !journey) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center space-y-4">
        <h1 className="text-3xl font-bold text-red-600">Link Expired or Invalid</h1>
        <p className="text-lg text-muted">This helper link has been revoked or does not exist.</p>
      </div>
    );
  }

  const profile = journey.profile || {};
  const getCountryName = (code?: string) => {
    if (code === "IN") return "India";
    if (code === "US") return "United States";
    return code || "Not selected";
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
      {/* Banner */}
      <div className="rounded-2xl border-2 border-accent bg-accent-soft p-6 shadow-md space-y-2">
        <span className="inline-block rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-ink">
          Collaborator View ({label || "Helper"})
        </span>
        <h1 className="text-3xl font-bold">Traveler Profile Overview</h1>
        <p className="text-lg text-muted">
          Reviewing planned itinerary and trip details securely shared by the traveler.
        </p>
      </div>

      {/* Profile Details Card */}
      <div className="rounded-xl border-2 border-line-strong bg-surface p-6 shadow-sm">
        <h2 className="mb-6 text-2xl font-bold text-accent">Itinerary Details</h2>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm font-bold uppercase tracking-wide text-muted">Route</p>
            <p className="text-lg font-medium text-slate-800">
              {getCountryName(profile.from)} → {getCountryName(profile.to)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold uppercase tracking-wide text-muted">Arrival Date</p>
            <p className="text-lg font-medium text-slate-800">
              {profile.arrival ? formatDate(profile.arrival, "en") : "Not selected"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold uppercase tracking-wide text-muted">Duration of Stay</p>
            <p className="text-lg font-medium text-slate-800">
              {profile.stayMonths ? `${profile.stayMonths} months` : "Not selected"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold uppercase tracking-wide text-muted">Reason for Visit</p>
            <p className="text-lg font-medium text-slate-800">Tourism / Business (B1/B2)</p>
          </div>
        </div>
      </div>

      {/* WhatsApp Quick Action */}
      <div className="rounded-xl border-2 border-dashed border-line-strong p-6 text-center space-y-3 bg-surface">
        <h3 className="text-xl font-bold">Contact Traveler</h3>
        <p className="text-muted">Quickly message the traveler via WhatsApp regarding their itinerary.</p>
        <a
          href={`https://wa.me/?text=Hi,%20I'm%20reviewing%20your%20travel%20profile%20and%20itinerary%20details%20on%20Fly%20By%20VISA!`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-green-600 px-6 py-3 text-lg font-bold text-white shadow hover:bg-green-700"
        >
          Send WhatsApp Message
        </a>
      </div>
    </div>
  );
}

export default function HelperPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-xl px-6 py-20 text-center text-lg text-muted">Loading profile view...</div>}>
      <HelperContent params={params} />
    </Suspense>
  );
}