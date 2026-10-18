// Shared by the upload routes (server) and the My documents panel (browser).
// Pure data and tiny helpers: no Node or Vercel imports, so it is safe in both.

import type { DocId } from "@/content/documents";

/** The two kinds of file a person can add. */
export const UPLOAD_KINDS = ["immigration", "scam_evidence"] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];

export function isUploadKind(value: unknown): value is UploadKind {
  return typeof value === "string" && (UPLOAD_KINDS as readonly string[]).includes(value);
}

/**
 * Server uploads on Vercel are limited to about 4.5 MB per request, so a file
 * has to stay a little under that.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** A small cap per person, so one account cannot fill the store. */
export const MAX_FILES_PER_USER = 20;

/** What we accept: scans, photos, screenshots, saved emails and plain text. */
export const ALLOWED_TYPES = {
  "application/pdf": ["pdf"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "text/plain": ["txt"],
  "message/rfc822": ["eml"],
} as const;
export type AllowedType = keyof typeof ALLOWED_TYPES;

/** For the file picker's `accept` attribute. */
export const ACCEPT_ATTRIBUTE = [
  ...Object.keys(ALLOWED_TYPES),
  ...Object.values(ALLOWED_TYPES).flatMap((exts) => exts.map((e) => `.${e}`)),
].join(",");

/** Error codes the routes send back. The panel turns each into a translated message. */
export const UPLOAD_ERRORS = [
  "unauthorized",
  "bad_request",
  "bad_type",
  "too_large",
  "too_many",
  "not_found",
  "unavailable",
  "server",
] as const;
export type UploadError = (typeof UPLOAD_ERRORS)[number];

/** What the list route returns for each file. */
export interface UploadedFile {
  /** The private path in the store. Only meaningful to our own routes. */
  pathname: string;
  kind: UploadKind;
  /** The roadmap document this file is a copy of, or null ("Other files"). */
  docId: DocId | null;
  name: string;
  size: number;
  uploadedAt: string;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
