"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useT, type UiKey } from "@/lib/i18n";
import { formatDate } from "@/lib/journey";
import { MAX_FILES_PER_USER, MAX_UPLOAD_BYTES, type UploadedFile } from "@/lib/uploadsShared";
import { deleteUploads, fetchFiles, useSavedConsent } from "./DocumentsScreen";

const MB = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));
const dangerButton =
  "inline-flex min-h-12 w-full items-center justify-center text-center sm:w-auto rounded-xl border-2 border-danger bg-surface px-5 py-2 text-lg font-semibold text-danger hover:bg-hover-danger disabled:opacity-60";

/**
 * Account page, traveler only: the Documents consent, how many files are
 * saved, and "Delete all my files". Caregivers use HelperAccountScreen, so
 * they never see this.
 */
export function YourFilesCard() {
  const { t, lang } = useT();
  const consent = useSavedConsent();
  // null while loading or when the list could not be loaded: then no count and no button.
  const [files, setFiles] = useState<UploadedFile[] | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; problem: boolean } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const refresh = useCallback(async () => setFiles(await fetchFiles("/api/uploads")), []);
  useEffect(() => {
    let active = true;
    fetchFiles("/api/uploads").then((loaded) => active && setFiles(loaded));
    return () => {
      active = false;
    };
  }, []);

  // Open and close the native dialog together with `confirming`.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (confirming && !dialog.open) dialog.showModal();
    if (!confirming && dialog.open) dialog.close();
  }, [confirming]);

  async function confirmDeleteAll() {
    setConfirming(false);
    setBusy(true);
    const error = await deleteUploads({ all: true });
    setMessage(
      error
        ? { text: t(`files.err.${error}` as UiKey, { mb: MB, n: MAX_FILES_PER_USER }), problem: true }
        : { text: t("files.allDeleted"), problem: false },
    );
    if (!error) await refresh();
    setBusy(false);
  }

  const count = files?.length ?? 0;

  return (
    <section aria-labelledby="your-files-title" className="space-y-3 rounded-xl border-2 border-line-strong bg-surface p-6">
      <h2 id="your-files-title" className="text-2xl font-bold text-accent">
        {t("account.files.title")}
      </h2>

      {/* The Documents consent, read from the same localStorage keys the Documents page writes. */}
      {consent.agreed !== null &&
        (consent.agreed ? (
          <p className="text-lg">
            {consent.date ? t("account.ack.agreedOn", { date: formatDate(consent.date, lang) }) : t("account.ack.agreed")}
          </p>
        ) : (
          <p className="text-lg">
            {t("account.ack.notYet")}{" "}
            <Link href="/documents" className="font-semibold text-accent underline">
              {t("account.ack.link")}
            </Link>
          </p>
        ))}

      {files && (
        <p className="text-lg font-semibold">
          {count === 1 ? t("account.files.countOne") : t("account.files.count", { n: count })}
        </p>
      )}

      {count > 0 && (
        <button type="button" disabled={busy} onClick={() => setConfirming(true)} className={dangerButton}>
          {t("files.deleteAll")}
        </button>
      )}

      <p
        role="status"
        aria-live="polite"
        className={`text-lg ${message ? "" : "sr-only"} ${message?.problem ? "font-semibold text-danger" : "text-muted"}`}
      >
        {message?.text ?? ""}
      </p>

      {/* Native dialog: focus is trapped and Escape closes it. "Keep it" comes first. */}
      <dialog
        ref={dialogRef}
        aria-labelledby="files-all-dialog-title"
        onClose={() => setConfirming(false)}
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border-2 border-line-strong bg-surface p-6 text-ink"
      >
        {confirming && (
          <div className="space-y-4">
            <h2 id="files-all-dialog-title" className="text-2xl font-bold">
              {t("files.deleteAllTitle")}
            </h2>
            <p className="break-words text-lg">{t("files.deleteAllBody", { n: count })}</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => setConfirming(false)}
                className="inline-flex min-h-12 w-full items-center justify-center text-center sm:w-auto rounded-xl bg-accent px-6 py-2 text-lg font-bold text-accent-ink"
              >
                {t("files.keep")}
              </button>
              <button
                type="button"
                onClick={confirmDeleteAll}
                className="inline-flex min-h-12 w-full items-center justify-center text-center sm:w-auto rounded-xl border-2 border-danger bg-surface px-6 py-2 text-lg font-semibold text-danger hover:bg-hover-danger"
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
