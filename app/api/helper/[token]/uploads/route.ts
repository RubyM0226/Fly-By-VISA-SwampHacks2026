import { list, put } from "@vercel/blob";
import { getHelperJourneyOwner, type HelperOwner } from "@/lib/helperAccess";
import {
  MAX_FILES_PER_USER,
  isUploadKind,
  type UploadError,
  type UploadedFile,
} from "@/lib/uploadsShared";
import { isUploadDocId, type DocId } from "@/content/documents";
import { buildPathname, checkUpload, parsePathname, userPrefix } from "@/lib/uploadsServer";

// A caregiver's view of the traveler's private uploads, by helper-link token.
//
//   GET  /api/helper/[token]/uploads   list the traveler's files -> { files }
//   POST /api/helper/[token]/uploads   multipart: file + kind [+ docId] -> { file }
//
// No session: the token is the key. Every call re-checks it, so a revoked link
// stops working at once. Caregivers can view and add, never delete or replace
// (there is no DELETE, and "replaces" is ignored).
// PRIVACY: never log file names or contents.

const NO_STORE = { "Cache-Control": "private, no-store" };

function fail(error: UploadError, status: number) {
  return Response.json({ error }, { status, headers: NO_STORE });
}

function denied(owner: Extract<HelperOwner, { ok: false }>) {
  return owner.error === "unavailable" ? fail("unavailable", 409) : fail("not_found", 404);
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
  return {
    pathname: b.pathname,
    kind: parsed.kind,
    docId: parsed.docId,
    name: parsed.name,
    size: b.size,
    uploadedAt: b.uploadedAt.toISOString(),
  };
}

export async function GET(_request: Request, ctx: RouteContext<"/api/helper/[token]/uploads">) {
  try {
    const owner = await getHelperJourneyOwner((await ctx.params).token);
    if (!owner.ok) return denied(owner);

    const blobs = await listAll(userPrefix(owner.sub));
    const files = blobs
      .map(toFile)
      .filter((f): f is UploadedFile => f !== null)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
    return Response.json({ files }, { headers: NO_STORE });
  } catch {
    return fail("server", 500);
  }
}

export async function POST(request: Request, ctx: RouteContext<"/api/helper/[token]/uploads">) {
  let owner: HelperOwner;
  try {
    owner = await getHelperJourneyOwner((await ctx.params).token);
  } catch {
    return fail("server", 500);
  }
  if (!owner.ok) return denied(owner);
  const sub = owner.sub;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("bad_request", 400);
  }

  const file = form.get("file");
  const kind = form.get("kind");
  if (!(file instanceof File) || !isUploadKind(kind)) return fail("bad_request", 400);

  // Optional: the roadmap document this file is a copy of (visa papers only).
  const docIdField = form.get("docId");
  let docId: DocId | undefined;
  if (docIdField !== null) {
    if (!isUploadDocId(docIdField) || kind !== "immigration") return fail("bad_request", 400);
    docId = docIdField;
  }
  // "replaces" is deliberately ignored: caregivers never remove the traveler's files.

  const head = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
  const checked = checkUpload(file, head);
  if (!checked.ok) return fail(checked.error, checked.error === "too_large" ? 413 : 400);

  try {
    const existing = await listAll(userPrefix(sub));
    if (existing.length >= MAX_FILES_PER_USER) return fail("too_many", 409);

    const blob = await put(buildPathname(sub, kind, file.name, docId), file, {
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
