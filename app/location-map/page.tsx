import type { Metadata } from "next";
import { Suspense } from "react";
import { auth0 } from "@/lib/auth0";
import sql from "@/lib/db";
import { LocationMapScreen } from "@/components/LocationMapScreen";
import { SignInWall } from "@/components/SignInWall";

export const metadata: Metadata = { title: "Office Map: FlyByVisa" };

/** Signed in, with a saved journey (onboarding finished, so it has a profile)? */
async function access(): Promise<"open" | "signIn" | "needsPlan"> {
  let sub: string | undefined;
  try {
    sub = (await auth0.getSession())?.user?.sub;
  } catch {
    // Auth0 not set up on this machine: treat as signed out.
  }
  if (!sub) return "signIn";
  try {
    const rows = await sql`SELECT 1 FROM journeys WHERE user_id = ${sub} AND profile IS NOT NULL LIMIT 1`;
    return rows.length > 0 ? "open" : "needsPlan";
  } catch (error) {
    // Cannot confirm a saved plan: keep the map locked rather than guess.
    console.error("Office Map journey lookup failed:", error);
    return "needsPlan";
  }
}

/**
 * Checked on the server: the map and wait times render only for signed-in
 * travelers with a saved journey. Everyone else gets the blurred wall.
 */
async function OfficeMap() {
  const state = await access();
  if (state === "open") return <LocationMapScreen />;
  return <SignInWall returnTo="/location-map" needsPlan={state === "needsPlan"} />;
}

export default function LocationMapPage() {
  // Reading the session is request-time data, so it streams in under Suspense (like SignInGate).
  return (
    <Suspense fallback={null}>
      <OfficeMap />
    </Suspense>
  );
}
