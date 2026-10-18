import { createHash, randomUUID } from "node:crypto";
import { isUploadDocId, type DocId } from "@/content/documents";
import {
  ALLOWED_TYPES,
  MAX_UPLOAD_BYTES,
  isUploadKind,
  type AllowedType,
  type UploadError,
  type UploadKind,
} from "./uploadsShared";

// Server-only helpers for private document uploads (Vercel Blob).
//
// PRIVACY: never log file names or contents. Files live in a PRIVATE Blob
// store, so there is no public URL; every read goes through our own routes,
// which check that the file belongs to the signed-in person.

/**
 * A stable, non-reversible folder name for a person. We hash the Auth0 id so
 * the raw id never appears in a path.
 */
export function userPrefix(sub: string): string {
  const hash = createHash("sha256").update(sub).digest("hex").slice(0, 32);
  return `u/${hash}/`;
}

/** Keeps letters (any language), digits, dots, dashes and underscores. */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const cleaned = base
    .normalize("NFC")
    .replace(/[^\p{L}\p{M}\p{N}._-]+/gu, "_")
    .replace(/^[._-]+/, "")
    .replace(/_{2,}/g, "_");
  const trimmed = cleaned.slice(-80);
  return trimmed || "file";
}

/**
 * u/<hash>/<kind>/[<docId>/]<uuid>/<name>. The uuid keeps names unique without
 * a random suffix. docId ties the file to a document in content/documents.ts;
 * files added before documents existed have no docId segment.
 */
export function buildPathname(sub: string, kind: UploadKind, fileName: string, docId?: DocId): string {
  const doc = docId ? `${docId}/` : "";
  return `${userPrefix(sub)}${kind}/${doc}${randomUUID()}/${sanitizeFileName(fileName)}`;
}

// The docId segment has no dashes, so it can never be mistaken for the uuid.
const PATH_SHAPE = /^u\/[0-9a-f]{32}\/(immigration|scam_evidence)\/(?:[A-Za-z0-9]{1,40}\/)?[0-9a-f-]{36}\/[^/]+$/;

/** True only for a well-formed path inside this person's own folder. */
export function isOwnPathname(pathname: unknown, sub: string): pathname is string {
  return (
    typeof pathname === "string" &&
    pathname.length < 300 &&
    !pathname.includes("..") &&
    pathname.startsWith(userPrefix(sub)) &&
    PATH_SHAPE.test(pathname)
  );
}

export interface ParsedPathname {
  kind: UploadKind;
  name: string;
  /** Null for older files and for ids no longer in the catalog: they show under "Other files". */
  docId: DocId | null;
}

export function parsePathname(pathname: string): ParsedPathname | null {
  const parts = pathname.split("/");
  if (!isUploadKind(parts[2])) return null;
  if (parts.length === 5) return { kind: parts[2], name: parts[4], docId: null };
  if (parts.length === 6) return { kind: parts[2], name: parts[5], docId: isUploadDocId(parts[3]) ? parts[3] : null };
  return null;
}

/** What the first bytes of a file say it is. Null when it is not a type we accept. */
export function sniffType(bytes: Uint8Array): AllowedType | null {
  const starts = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (starts([0x25, 0x50, 0x44, 0x46])) return "application/pdf"; // %PDF
  if (starts([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}

/** Plain text and saved emails: no NUL bytes in the first 4 KB. */
function looksLikeText(bytes: Uint8Array): boolean {
  const head = bytes.subarray(0, 4096);
  for (let i = 0; i < head.length; i++) if (head[i] === 0) return false;
  return true;
}

export type CheckedUpload =
  | { ok: true; contentType: AllowedType }
  | { ok: false; error: Extract<UploadError, "bad_type" | "too_large" | "bad_request"> };

/**
 * Checks the claimed type, the file extension, the size and the real content.
 * The browser's idea of the type is not trusted on its own.
 */
export function checkUpload(file: { name: string; type: string; size: number }, head: Uint8Array): CheckedUpload {
  if (file.size <= 0) return { ok: false, error: "bad_request" };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "too_large" };

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const sniffed = sniffType(head);

  // Binary formats: the content decides.
  if (sniffed) {
    const exts = ALLOWED_TYPES[sniffed] as readonly string[];
    if (!exts.includes(ext)) return { ok: false, error: "bad_type" };
    return { ok: true, contentType: sniffed };
  }

  // Text formats: the extension decides, and the content must look like text.
  if (ext === "txt" && looksLikeText(head)) return { ok: true, contentType: "text/plain" };
  if (ext === "eml" && looksLikeText(head)) return { ok: true, contentType: "message/rfc822" };

  return { ok: false, error: "bad_type" };
}

/** Images and PDFs open in the browser; text and emails are downloaded. */
export function dispositionFor(type: AllowedType, name: string): string {
  const inline = type === "application/pdf" || type.startsWith("image/");
  return `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(name)}`;
}
