import { get } from "@vercel/blob";
import { auth0 } from "@/lib/auth0";
import { ALLOWED_TYPES, type AllowedType } from "@/lib/uploadsShared";
import { dispositionFor, isOwnPathname, parsePathname } from "@/lib/uploadsServer";

// GET /api/uploads/file?pathname=...  streams one of MY private files.
// The Blob store is private, so this route is the only way to read a file.
// PRIVACY: never log file names or contents.

const NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const session = await auth0.getSession();
  const sub = session?.user?.sub;
  if (typeof sub !== "string" || sub.length === 0) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }

  const pathname = new URL(request.url).searchParams.get("pathname");
  // A path that is not inside my own folder looks exactly like a missing file.
  if (!isOwnPathname(pathname, sub)) {
    return Response.json({ error: "not_found" }, { status: 404, headers: NO_STORE });
  }

  try {
    const result = await get(pathname, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return Response.json({ error: "not_found" }, { status: 404, headers: NO_STORE });
    }

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
