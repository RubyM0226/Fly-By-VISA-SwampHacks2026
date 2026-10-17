"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT, type UiKey } from "@/lib/i18n";
import { formatDate } from "@/lib/journey";
import {
  ACCEPT_ATTRIBUTE,
  ALLOWED_TYPES,
  MAX_FILES_PER_USER,
  MAX_UPLOAD_BYTES,
  UPLOAD_ERRORS,
  UPLOAD_KINDS,
  formatBytes,
  type UploadError,
  type UploadKind,
  type UploadedFile,
} from "@/lib/uploadsShared";
import { ExternalIcon } from "./Icons";

// "My files": private uploads for signed-in people, kept in a private Vercel
// Blob store (see app/api/uploads). Show this only when someone is logged in.

const CONSENT_KEY = "flybyvisa-files-consent";
const MB = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));
const ALLOWED_EXTENSIONS: string[] = Object.values(ALLOWED_TYPES).flatMap((exts) => [...exts]);

type DeleteTarget = { kind: "one"; file: UploadedFile } | { kind: "all" } | null;

function isUploadError(value: unknown): value is UploadError {
  return typeof value === "string" && (UPLOAD_ERRORS as readonly string[]).includes(value);
}

/** Reads the error code from a failed response, if there is one. */
async function errorCode(res: Response): Promise<UploadError> {
  try {
    const body = (await res.json()) as { error?: unknown };
    if (isUploadError(body.error)) return body.error;
  } catch {
    /* not JSON */
  }
  return res.status === 401 ? "unauthorized" : "server";
}

/** The signed-in person's files, or null when they could not be loaded. */
async function fetchFiles(): Promise<UploadedFile[] | null> {
  try {
    const res = await fetch("/api/uploads", { cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json()) as { files: UploadedFile[] };
    return body.files;
  } catch {
    return null;
  }
}

/** This panel only mounts after sign-in is known, in the browser, so this is safe to read once. */
function readConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "yes";
  } catch {
    return false; // private mode: start unticked
  }
}

export function MyDocuments() {
  const { t, lang } = useT();
  const [files, setFiles] = useState<UploadedFile[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [kind, setKind] = useState<UploadKind>("immigration");
  const [consent, setConsent] = useState(readConsent);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; problem: boolean }>({ text: "", problem: false });
  const [target, setTarget] = useState<DeleteTarget>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const say = (text: string, problem = false) => setMessage({ text, problem });
  const errorText = (code: UploadError) =>
    t(`files.err.${code}` as UiKey, { mb: MB, n: MAX_FILES_PER_USER });

  const apply = useCallback((loaded: UploadedFile[] | null) => {
    if (loaded) {
      setFiles(loaded);
      setLoadFailed(false);
    } else {
      setLoadFailed(true);
      setFiles((current) => current ?? []);
    }
  }, []);

  const refresh = useCallback(async () => apply(await fetchFiles()), [apply]);

  useEffect(() => {
    let active = true;
    void fetchFiles().then((loaded) => {
      if (active) apply(loaded);
    });
    return () => {
      active = false;
    };
  }, [apply]);

  // Open and close the native dialog together with `target`.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (target && !dialog.open) dialog.showModal();
    if (!target && dialog.open) dialog.close();
  }, [target]);

  function onConsent(checked: boolean) {
    setConsent(checked);
    try {
      localStorage.setItem(CONSENT_KEY, checked ? "yes" : "no");
    } catch {
      /* ignore */
    }
  }

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!consent) return say(t("files.consentNeeded"), true);
    if (!file) return say(t("files.noFile"), true);

    // Quick checks here save a round trip. The server checks again.
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) return say(errorText("bad_type"), true);
    if (file.size > MAX_UPLOAD_BYTES) return say(errorText("too_large"), true);

    setBusy(true);
    say(t("files.uploading"));
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", kind);
      const res = await fetch("/api/uploads", { method: "POST", body });
      if (!res.ok) {
        say(errorText(await errorCode(res)), true);
        return;
      }
      if (inputRef.current) inputRef.current.value = "";
      say(t("files.added"));
      await refresh();
    } catch {
      say(errorText("server"), true);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    const current = target;
    setTarget(null);
    if (!current) return;
    setBusy(true);
    try {
      const url =
        current.kind === "all"
          ? "/api/uploads?all=1"
          : `/api/uploads?pathname=${encodeURIComponent(current.file.pathname)}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        say(errorText(await errorCode(res)), true);
        return;
      }
      say(t(current.kind === "all" ? "files.allDeleted" : "files.deleted"));
      await refresh();
    } catch {
      say(errorText("server"), true);
    } finally {
      setBusy(false);
    }
  }

  const count = files?.length ?? 0;
  const kindLabel = (k: UploadKind) => t(k === "immigration" ? "files.kind.short.immigration" : "files.kind.short.scam");

  return (
    <section aria-labelledby="files-title" className="space-y-5 rounded-xl border-2 border-line-strong bg-surface p-4 sm:p-6">
      <div className="space-y-2">
        <h2 id="files-title" className="text-2xl font-bold text-accent">
          {t("files.title")}
        </h2>
        <p className="text-lg text-muted">{t("files.lead")}</p>
      </div>

      <form onSubmit={onUpload} className="space-y-5" noValidate>
        <fieldset className="space-y-2">
          <legend className="mb-1 text-lg font-bold">{t("files.kind")}</legend>
          {UPLOAD_KINDS.map((k) => (
            <label key={k} className="block cursor-pointer">
              <input
                type="radio"
                name="file-kind"
                value={k}
                checked={kind === k}
                onChange={() => setKind(k)}
                className="peer sr-only"
              />
              <span className="flex min-h-14 items-center rounded-xl border-2 border-line-strong bg-surface px-4 py-3 text-lg peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:font-semibold peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]">
                {t(k === "immigration" ? "files.kind.immigration" : "files.kind.scam")}
              </span>
            </label>
          ))}
        </fieldset>

        <div className="space-y-2">
          <label htmlFor="file-input" className="block text-lg font-bold">
            {t("files.choose")}
          </label>
          <input
            ref={inputRef}
            id="file-input"
            type="file"
            accept={ACCEPT_ATTRIBUTE}
            aria-describedby="file-formats"
            className="block w-full min-w-0 rounded-xl border-2 border-line-strong bg-surface p-2 text-lg file:mb-2 file:mr-0 file:block file:w-full file:min-h-12 file:cursor-pointer file:rounded-lg file:border-0 file:bg-accent file:px-5 file:py-2 file:text-lg file:font-bold file:text-accent-ink"
          />
          <p id="file-formats" className="text-base text-muted">
            {t("files.formats", { mb: MB, n: MAX_FILES_PER_USER })}
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-lg">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => onConsent(e.target.checked)}
            className="mt-1 h-6 w-6 shrink-0 accent-[var(--accent)]"
          />
          <span>{t("files.consent")}</span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-12 w-full items-center justify-center text-center sm:w-auto rounded-xl bg-accent px-6 py-3 text-lg font-bold text-accent-ink disabled:opacity-60"
          >
            {t("files.upload")}
          </button>
        </div>

        <p
          role="status"
          aria-live="polite"
          className={`min-h-7 text-lg ${message.problem ? "font-semibold text-danger" : "text-muted"}`}
        >
          {message.text}
        </p>
      </form>

      <div className="space-y-3 border-t-2 border-line pt-5">
        <h3 className="text-xl font-bold">
          {t("files.listTitle")}
          {files && files.length > 0 ? (
            <span className="ml-2 text-base font-normal text-muted">
              {t("files.count", { n: count, max: MAX_FILES_PER_USER })}
            </span>
          ) : null}
        </h3>

        {files === null && <p className="text-lg text-muted">{t("files.loading")}</p>}
        {loadFailed && <p className="text-lg font-semibold text-danger">{t("files.loadError")}</p>}
        {files && files.length === 0 && !loadFailed && <p className="text-lg text-muted">{t("files.none")}</p>}

        {files && files.length > 0 && (
          <ul className="space-y-3">
            {files.map((f) => (
              <li key={f.pathname} className="space-y-3 rounded-xl border-2 border-line p-3 sm:p-4">
                <div className="space-y-1">
                  <p className="inline-block rounded-lg border-2 border-line-strong px-3 py-0.5 text-sm font-bold">
                    {kindLabel(f.kind)}
                  </p>
                  <p className="break-all text-lg font-semibold">{f.name}</p>
                  <p className="text-base text-muted">
                    {formatBytes(f.size)} · {formatDate(f.uploadedAt.slice(0, 10), lang)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={`/api/uploads/file?pathname=${encodeURIComponent(f.pathname)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-button
                    className="inline-flex min-h-12 w-full items-center justify-center text-center sm:w-auto gap-1 rounded-xl border-2 border-line-strong bg-surface px-5 py-2 text-lg font-semibold hover:bg-accent-soft"
                  >
                    {t("files.open")}
                    <span className="sr-only"> {f.name}</span>
                    <ExternalIcon className="h-4 w-4" />
                    <span className="sr-only"> {t("journey.opensNewTab")}</span>
                  </a>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setTarget({ kind: "one", file: f })}
                    className="inline-flex min-h-12 w-full items-center justify-center text-center sm:w-auto rounded-xl border-2 border-danger bg-surface px-5 py-2 text-lg font-semibold text-danger hover:bg-danger-soft disabled:opacity-60"
                  >
                    {t("files.delete")}
                    <span className="sr-only"> {f.name}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {files && files.length > 1 && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setTarget({ kind: "all" })}
            className="inline-flex min-h-12 w-full items-center justify-center text-center sm:w-auto rounded-xl border-2 border-danger bg-surface px-5 py-2 text-lg font-semibold text-danger hover:bg-danger-soft disabled:opacity-60"
          >
            {t("files.deleteAll")}
          </button>
        )}
      </div>

      {/* Native dialog: focus is trapped and Escape closes it. "Keep it" comes first. */}
      <dialog
        ref={dialogRef}
        aria-labelledby="files-dialog-title"
        onClose={() => setTarget(null)}
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border-2 border-line-strong bg-surface p-6 text-ink"
      >
        {target && (
          <div className="space-y-4">
            <h2 id="files-dialog-title" className="text-2xl font-bold">
              {t(target.kind === "all" ? "files.deleteAllTitle" : "files.deleteTitle")}
            </h2>
            <p className="break-words text-lg">
              {target.kind === "all"
                ? t("files.deleteAllBody", { n: count })
                : t("files.deleteBody", { name: target.file.name })}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => setTarget(null)}
                className="inline-flex min-h-12 w-full items-center justify-center text-center sm:w-auto rounded-xl bg-accent px-6 py-2 text-lg font-bold text-accent-ink"
              >
                {t("files.keep")}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="inline-flex min-h-12 w-full items-center justify-center text-center sm:w-auto rounded-xl border-2 border-danger bg-surface px-6 py-2 text-lg font-semibold text-danger hover:bg-danger-soft"
              >
                {t("files.confirmDelete")}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
