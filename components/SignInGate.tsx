import { Suspense } from "react";
import { auth0 } from "@/lib/auth0";
import { SignInWall } from "./SignInWall";

async function Session({ returnTo, children }: { returnTo: string; children: React.ReactNode }) {
  let signedIn = false;
  try {
    signedIn = Boolean(await auth0.getSession());
  } catch {
    // Auth0 not set up on this machine: treat as signed out.
  }
  return signedIn ? children : <SignInWall returnTo={returnTo} />;
}

/**
 * Wraps a page that needs a signed-in user. The session is checked on the
 * server. Signed out, `children` are never rendered (so no private data is
 * loaded): the page shows a blurred stand-in with a sign-in message instead.
 * Suspense is needed because reading the session is request-time data.
 */
export function SignInGate({ returnTo, children }: { returnTo: string; children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <Session returnTo={returnTo}>{children}</Session>
    </Suspense>
  );
}
