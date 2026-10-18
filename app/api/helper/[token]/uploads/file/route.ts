import { get } from "@vercel/blob";
import { getHelperJourneyOwner } from "@/lib/helperAccess";
import { ALLOWED_TYPES, type AllowedType } from "@/lib/uploadsShared";
import { dispositionFor, isOwnPathname, parsePathname } from "@/lib/uploadsServer";

// GET /api/helper/[token]/uploads/file?pathname=...  streams one of the
// traveler's private files to a caregiver with a valid, unrevoked helper link.
// PRIVACY: never log file names or contents.

const NO_STORE = { "Cache-Control": "private, no-store" };
const notFound = () => Response.json({ error: "not_found" }, { status: 404, headers: NO_STORE });

export async function GET(request: Request, ctx: RouteContext<"/api/helper/[token]/uploads/file">) {
  try {
    const owner = await getHelperJourneyOwner((await ctx.params).token);
    if (!owner.ok) {
      return owner.error === "unavailable"
        ? Response.json({ error: "unavailable" }, { status: 409, headers: NO_STORE })
        : notFound();
    }

    const pathname = new URL(request.url).searchParams.get("pathname");
    // A path that is not inside the traveler's folder looks exactly like a missing file.
    if (!isOwnPathname(pathname, owner.sub)) return notFound();

    const result = await get(pathname, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) return notFound();

    // Use the type we validated and stored, never one chosen by the file.
    const stored = result.blob.contentType ?? "";
    const type: AllowedType = stored in ALLOWED_TYPES ? (stored as AllowedType) : "text/plain";
    const name = parsePathname(pathname)?.name ?? "file";

    return new Response(result.stream, {
      headers: {
        "Content-Type": type,
        "Content-Disposition": dispositionFor(type, name),
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
        ...NO_STORE,
      },
    });
  } catch {
    return Response.json({ error: "server" }, { status: 500, headers: NO_STORE });
  }
}
