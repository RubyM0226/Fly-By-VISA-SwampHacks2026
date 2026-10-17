import { del, list, put } from "@vercel/blob";
import { auth0 } from "@/lib/auth0";
import {
  MAX_FILES_PER_USER,
  isUploadKind,
  type UploadError,
  type UploadedFile,
} from "@/lib/uploadsShared";
import { buildPathname, checkUpload, isOwnPathname, parsePathname, userPrefix } from "@/lib/uploadsServer";

// Private document uploads, stored in a PRIVATE Vercel Blob store.
//
//   POST   /api/uploads            multipart: file + kind  -> { file }
//   GET    /api/uploads            list my files           -> { files }
//   DELETE /api/uploads?pathname=  delete one of my files
//   DELETE /api/uploads?all=1      delete all of my files
//
// Every handler checks the session itself (not only middleware) and only ever
// touches paths inside the signed-in person's own folder.
// PRIVACY: never log file names or contents.

const NO_STORE = { "Cache-Control": "private, no-store" };

function fail(error: UploadError, status: number) {
  return Response.json({ error }, { status, headers: NO_STORE });
}

async function currentSub(): Promise<string | null> {
  const session = await auth0.getSession();
  const sub = session?.user?.sub;
  return typeof sub === "string" && sub.length > 0 ? sub : null;
}

/** Every blob in a prefix, following the cursor. */
async function listAll(prefix: string) {
  const all: Awaited<ReturnType<typeof list>>["blobs"] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, limit: 100, cursor });
    all.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return all;
}

function toFile(b: { pathname: string; size: number; uploadedAt: Date }): UploadedFile | null {
  const parsed = parsePathname(b.pathname);
  if (!parsed) return null;
  return { pathname: b.pathname, kind: parsed.kind, name: parsed.name, size: b.size, uploadedAt: b.uploadedAt.toISOString() };
}

export async function GET() {
  const sub = await currentSub();
  if (!sub) return fail("unauthorized", 401);

  try {
    const blobs = await listAll(userPrefix(sub));
    const files = blobs
      .map(toFile)
      .filter((f): f is UploadedFile => f !== null)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
    return Response.json({ files }, { headers: NO_STORE });
  } catch {
    return fail("server", 500);
  }
}

export async function POST(request: Request) {
  const sub = await currentSub();
  if (!sub) return fail("unauthorized", 401);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("bad_request", 400);
  }

  const file = form.get("file");
  const kind = form.get("kind");
  if (!(file instanceof File) || !isUploadKind(kind)) return fail("bad_request", 400);

  const head = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
  const checked = checkUpload(file, head);
  if (!checked.ok) return fail(checked.error, checked.error === "too_large" ? 413 : 400);

  try {
    const existing = await listAll(userPrefix(sub));
    if (existing.length >= MAX_FILES_PER_USER) return fail("too_many", 409);

    const blob = await put(buildPathname(sub, kind, file.name), file, {
      access: "private",
      contentType: checked.contentType,
      addRandomSuffix: false,
      allowOverwrite: false,
    });

    const saved = toFile({ pathname: blob.pathname, size: file.size, uploadedAt: new Date() });
    if (!saved) return fail("server", 500);
    return Response.json({ file: saved }, { status: 201, headers: NO_STORE });
  } catch {
    return fail("server", 500);
  }
}

export async function DELETE(request: Request) {
  const sub = await currentSub();
  if (!sub) return fail("unauthorized", 401);

  const params = new URL(request.url).searchParams;

  try {
    if (params.get("all") === "1") {
      const blobs = await listAll(userPrefix(sub));
      const paths = blobs.map((b) => b.pathname);
      for (let i = 0; i < paths.length; i += 50) await del(paths.slice(i, i + 50));
      return Response.json({ deleted: paths.length }, { headers: NO_STORE });
    }

    const pathname = params.get("pathname");
    if (!isOwnPathname(pathname, sub)) return fail("not_found", 404);
    await del(pathname);
    return Response.json({ deleted: 1 }, { headers: NO_STORE });
  } catch {
    return fail("server", 500);
  }
}
