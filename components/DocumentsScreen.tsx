"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { DOC_GROUPS, DOCUMENTS, UPLOAD_DOC_IDS, type Blank, type DocId } from "@/content/documents";
import { STEP_BY_ID } from "@/content/steps";
import { STEPS_BY_PURPOSE, type VisaCategory } from "@/lib/journey";
import { useTrip } from "@/lib/trip";
import { useT, type UiKey } from "@/lib/i18n";
import { useHome } from "@/lib/homeCountry";
import { todayISO } from "@/lib/clock";
import { formatDate } from "@/lib/journey";
import {
  ACCEPT_ATTRIBUTE,
  ALLOWED_TYPES,
  MAX_FILES_PER_USER,
  MAX_UPLOAD_BYTES,
  UPLOAD_ERRORS,
  formatBytes,
  type UploadError,
  type UploadKind,
  type UploadedFile,
} from "@/lib/uploadsShared";
import { plainText, RichText } from "./Glossary";
import { CheckIcon, CircleIcon, DocumentIcon, ExternalIcon } from "./Icons";
import { SpeakButton } from "./SpeakButton";

// The Documents tab: private uploads for signed-in people, kept in a private
// Vercel Blob store (see app/api/uploads). Files are grouped by the roadmap
// step that needs them; files with no document show under "Other files" (this
// includes older "scam_evidence" uploads, kept viewable; Scam Check handles
// scam messages now). Until the person ticks the consent box, only the
// disclaimer shows. Only mount this behind the sign-in gate, or with a
// helperToken for a caregiver: then it uses the token routes (app/api/helper),
// and can view and add files but never replace or delete them.

export const CONSENT_KEY = "flybyvisa-files-consent";
/** When they agreed (YYYY-MM-DD), for the Account page. Ticks from before this have none. */
export const CONSENT_DATE_KEY = "flybyvisa-files-consent-date";
const MB = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));
const ALLOWED_EXTENSIONS: string[] = Object.values(ALLOWED_TYPES).flatMap((exts) => [...exts]);
/** Where a status message shows: a document row ("<step>-<doc>") or "other". */
type Where = string;

type DeleteTarget = { kind: "one"; file: UploadedFile; where: Where } | { kind: "all" } | null;
type Message = { where: Where; text: string; problem: boolean };

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

/** The files at an uploads API, or null when they could not be loaded. */
async function fetchFiles(base: string): Promise<UploadedFile[] | null> {
  try {
    const res = await fetch(base, { cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json()) as { files: UploadedFile[] };
    return body.files;
  } catch {
    return null;
  }
}

const noopSubscribe = () => () => {};

function readKey(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // private mode: nothing saved
  }
}

/** The saved consent tick and its date. `agreed` is null on the server, where it is unknown. */
export function useSavedConsent(): { agreed: boolean | null; date: string | null } {
  const agreed = useSyncExternalStore(noopSubscribe, () => readKey(CONSENT_KEY) === "yes", () => null);
  const date = useSyncExternalStore(noopSubscribe, () => readKey(CONSENT_DATE_KEY), () => null);
  return { agreed, date };
}

const outlineButton =
  "inline-flex min-h-12 w-full items-center justify-center gap-1 text-center sm:w-auto rounded-xl border-2 border-line-strong bg-surface px-5 py-2 text-lg font-semibold hover:bg-hover disabled:opacity-60";
const dangerButton =
  "inline-flex min-h-12 w-full items-center justify-center text-center sm:w-auto rounded-xl border-2 border-danger bg-surface px-5 py-2 text-lg font-semibold text-danger hover:bg-hover-danger disabled:opacity-60";
const linkClass = "inline-flex min-h-12 items-center gap-1 text-lg font-semibold text-accent underline";

/** `home` is the traveler's home country when a caregiver views it (their own trip is not in this browser). */
export function DocumentsScreen({ helperToken, home }: { helperToken?: string; home?: string } = {}) {
  const { t, lang } = useT();
  const [trip] = useTrip(); // <-- ADD THIS LINE
  const { loc } = useHome(home);
  const caregiver = helperToken !== undefined;
  const base = caregiver ? `/api/helper/${encodeURIComponent(helperToken)}/uploads` : "/api/uploads";
  const [files, setFiles] = useState<UploadedFile[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const savedConsent = useSavedConsent().agreed;
  const [consentChoice, setConsentChoice] = useState<boolean | null>(null);
  // The consent tick is the traveler's own; a caregiver sees a note instead.
  // null: not read yet (server render), so show nothing rather than flash the disclaimer.
  const consent = caregiver || (consentChoice ?? savedConsent);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>({ where: "", text: "", problem: false });
  const [target, setTarget] = useState<DeleteTarget>(null);
  const otherInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  // Which document row the shared file picker is for.
  const pickRef = useRef<{ where: Where; docId: DocId; replaces?: string } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const say = (where: Where, text: string, problem = false) => setMessage({ where, text, problem });
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

  const refresh = useCallback(async () => apply(await fetchFiles(base)), [apply, base]);

  useEffect(() => {
    let active = true;
    void fetchFiles(base).then((loaded) => {
      if (active) apply(loaded);
    });
    return () => {
      active = false;
    };
  }, [apply, base]);

  // "View my documents" links to #docs-<step>. This screen streams in after the
  // sign-in check (and the consent read), so the browser's own jump can miss:
  // scroll and focus here once the sections exist.
  useEffect(() => {
    if (!consent) return;
    const id = window.location.hash.slice(1);
    if (!id.startsWith("docs-")) {
      // Just ticked: the checkbox is gone, so keep keyboard focus on the page.
      if (consentChoice) titleRef.current?.focus();
      return;
    }
    const heading = document.getElementById(id === "docs-other" ? "doc-other" : `docs-title-${id.slice(5)}`);
    heading?.closest("section")?.scrollIntoView();
    heading?.focus({ preventScroll: true });
  }, [consent, consentChoice]);

  // Open and close the native dialog together with `target`.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (target && !dialog.open) dialog.showModal();
    if (!target && dialog.open) dialog.close();
  }, [target]);

  function onConsent(checked: boolean) {
    setConsentChoice(checked);
    try {
      localStorage.setItem(CONSENT_KEY, checked ? "yes" : "no");
      if (checked) localStorage.setItem(CONSENT_DATE_KEY, todayISO());
    } catch {
      /* ignore */
    }
  }

  /** Keyboard and screen-reader users stay on the row they acted on after it re-renders. */
  function focusRow(where: Where) {
    document.getElementById(`doc-${where}`)?.focus();
  }

  /** Checks, sends and reports one upload. Returns true when it was saved. */
  async function send(
    file: File,
    opts: { where: Where; kind: UploadKind; docId?: DocId; replaces?: string },
  ): Promise<boolean> {
    // Quick checks here save a round trip. The server checks again.
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    const early = !ALLOWED_EXTENSIONS.includes(ext) ? "bad_type" : file.size > MAX_UPLOAD_BYTES ? "too_large" : null;
    if (early) {
      say(opts.where, errorText(early), true);
      return false;
    }

    setBusy(true);
    say(opts.where, t("files.uploading"));
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", opts.kind);
      if (opts.docId) body.append("docId", opts.docId);
      if (opts.replaces) body.append("replaces", opts.replaces);
      const res = await fetch(base, { method: "POST", body });
      if (!res.ok) {
        say(opts.where, errorText(await errorCode(res)), true);
        return false;
      }
      say(opts.where, t(opts.replaces ? "documents.replaced" : "files.added"));
      await refresh();
      return true;
    } catch {
      say(opts.where, errorText("server"), true);
      return false;
    } finally {
      setBusy(false);
    }
  }

  /** "Add my copy" and "Replace": open the file picker for one document. */
  function pickFor(where: Where, docId: DocId, replaces?: string) {
    pickRef.current = { where, docId, replaces };
    docInputRef.current?.click();
  }

  async function onDocPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const pick = pickRef.current;
    e.target.value = "";
    if (!file || !pick) return;
    await send(file, { ...pick, kind: "immigration" });
    focusRow(pick.where);
  }

  async function onOtherUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = otherInputRef.current?.files?.[0];
    if (!file) return say("other", t("files.noFile"), true);
    if ((await send(file, { where: "other", kind: "immigration" })) && otherInputRef.current) otherInputRef.current.value = "";
  }

  async function confirmDelete() {
    const current = target;
    setTarget(null);
    if (!current) return;
    const where = current.kind === "all" ? "all" : current.where;
    setBusy(true);
    try {
      const url =
        current.kind === "all"
          ? "/api/uploads?all=1"
          : `/api/uploads?pathname=${encodeURIComponent(current.file.pathname)}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        say(where, errorText(await errorCode(res)), true);
        return;
      }
      say(where, t(current.kind === "all" ? "files.allDeleted" : "files.deleted"));
      await refresh();
    } catch {
      say(where, errorText("server"), true);
    } finally {
      setBusy(false);
      if (current.kind === "one") focusRow(current.where);
    }
  }

  // Statuses are only shown once the list has really loaded, never guessed.
  const known = files !== null && !loadFailed;
  const filesFor = (docId: DocId) => (files ?? []).filter((f) => f.docId === docId);
  const otherFiles = (files ?? []).filter((f) => f.docId === null);
  
  // Filter document groups and requirements to match the user's specific visa type
  const stepOrder = STEPS_BY_PURPOSE[(trip.purpose as VisaCategory) || "family"];
  const myDocGroups = DOC_GROUPS.filter(group => stepOrder.includes(group.stepId));
  const myUniqueDocIds = [...new Set(myDocGroups.flatMap((g) => g.docs))];
  
  const addedCount = myUniqueDocIds.filter((id) => filesFor(id).length > 0).length;
  const count = files?.length ?? 0;
  const docName = (id: DocId) => loc(DOCUMENTS[id].name[lang]);

  const statusMessage = (where: Where) => (
    <p
      role="status"
      aria-live="polite"
      className={`text-lg ${message.where === where && message.text ? "" : "sr-only"} ${
        message.problem ? "font-semibold text-danger" : "text-muted"
      }`}
    >
      {message.where === where ? message.text : ""}
    </p>
  );

  const fileDetails = (f: UploadedFile) => (
    <div className="space-y-1">
      <p className="break-all text-lg font-semibold">{f.name}</p>
      <p className="text-base text-muted">
        {formatBytes(f.size)} · {formatDate(f.uploadedAt.slice(0, 10), lang)}
      </p>
    </div>
  );

  const openLink = (f: UploadedFile) => (
    <a
      href={`${base}/file?pathname=${encodeURIComponent(f.pathname)}`}
      target="_blank"
      rel="noopener noreferrer"
      data-button
      className={outlineButton}
    >
      {t("files.open")}
      <span className="sr-only"> {f.name}</span>
      <ExternalIcon className="h-4 w-4" />
      <span className="sr-only"> {t("journey.opensNewTab")}</span>
    </a>
  );

  const deleteButton = (f: UploadedFile, where: Where) =>
    !caregiver && (
      <button type="button" disabled={busy} onClick={() => setTarget({ kind: "one", file: f, where })} className={dangerButton}>
        {t("files.delete")}
        <span className="sr-only"> {f.name}</span>
      </button>
    );

  function blankInfo(blank: Blank | undefined) {
    if (!blank) return null;
    if (blank.type === "template") {
      return (
        <div className="space-y-1">
          <a href={`/api/templates/${blank.id}?lang=${lang}`} download className={linkClass}>
            <DocumentIcon className="h-5 w-5 shrink-0" />
            {t("documents.blank.template")}
          </a>
          <p className="text-base text-muted">{t("documents.blank.templateNote")}</p>
        </div>
      );
    }
    return (
      <div className="space-y-1">
        <p className="text-base text-muted">
          {t(blank.type === "online" ? "documents.blank.online" : "documents.blank.none")}
        </p>
        {blank.url && (
          <a href={blank.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {t(blank.type === "online" ? "documents.blank.onlineLink" : "documents.blank.noneLink")}
            <ExternalIcon className="h-4 w-4" />
            <span className="sr-only">{t("journey.opensNewTab")}</span>
          </a>
        )}
      </div>
    );
  }

  const header = (
    <div className="space-y-2">
      <h1 ref={titleRef} tabIndex={-1} className="text-3xl font-bold outline-none">{t(caregiver ? "helperDocs.title" : "nav.documents")}</h1>
      <p className="text-lg text-muted">{t(caregiver ? "helperDocs.lead" : "documents.lead")}</p>
    </div>
  );

  // Until the box is ticked, the page is only the disclaimer (nothing while it is still being read).
  if (!consent) {
    return (
      <div className="space-y-6">
        {header}
        {consent === false && (
          <section aria-label={t("files.title")} className="space-y-3 rounded-xl border-2 border-line-strong bg-surface p-4 sm:p-6">
            <p className="text-lg">{t("files.lead")}</p>
            <label className="flex cursor-pointer items-start gap-3 text-lg">
              <input
                type="checkbox"
                checked={false}
                onChange={(e) => onConsent(e.target.checked)}
                className="mt-1 h-6 w-6 shrink-0 accent-[var(--accent)]"
              />
              <span>{t("files.consent")}</span>
            </label>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      <section aria-label={t("files.title")} className="space-y-3 rounded-xl border-2 border-line-strong bg-surface p-4 sm:p-6">
        {caregiver && <p className="text-lg font-semibold">{t("helperDocs.note")}</p>}
        <p className="text-base text-muted">{t("files.formats", { mb: MB, n: MAX_FILES_PER_USER })}</p>
        {files === null && <p className="text-lg text-muted">{t("files.loading")}</p>}
        {loadFailed && <p className="text-lg font-semibold text-danger">{t("files.loadError")}</p>}
        {statusMessage("all")}
        {known && (
          <p className="text-lg font-semibold">
            {t("documents.summary", { n: addedCount, total: myUniqueDocIds.length })}
            <span className="ml-2 text-base font-normal text-muted">
              {t("files.count", { n: count, max: MAX_FILES_PER_USER })}
            </span>
          </p>
        )}
      </section>

      {/* One hidden picker shared by every "Add my copy" and "Replace" button. */}
      <input ref={docInputRef} type="file" accept={ACCEPT_ATTRIBUTE} hidden onChange={onDocPicked} />

      {myDocGroups.map(({ stepId, docs }) => {
        const title = STEP_BY_ID[stepId].text[lang].title;
        const readText = [
          `${title}.`,
          ...docs.map(
            (id) =>
              `${plainText(docName(id))}: ${
                known ? t(filesFor(id).length > 0 ? "documents.added" : "documents.missing") : ""
              }.`,
          ),
        ].join(" ");
        return (
          <section
            key={stepId}
            id={`docs-${stepId}`}
            aria-labelledby={`docs-title-${stepId}`}
            className="scroll-mt-24 space-y-4 rounded-xl border-2 border-line-strong bg-surface p-4 sm:p-6"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2 id={`docs-title-${stepId}`} tabIndex={-1} className="text-2xl font-bold text-accent outline-none">
                {title}
              </h2>
              <SpeakButton ownerId={`docs-${stepId}`} getText={() => readText} />
            </div>
            <ul className="space-y-3">
              {docs.map((docId) => {
                const where = `${stepId}-${docId}`;
                const mine = filesFor(docId);
                const has = mine.length > 0;
                return (
                  <li key={docId} className="space-y-3 rounded-xl border-2 border-line p-3 sm:p-4">
                    <div className="space-y-1">
                      <h3 id={`doc-${where}`} tabIndex={-1} className="text-xl font-bold outline-none">
                        <RichText text={docName(docId)} />
                      </h3>
                      {known && (
                        <p className={`flex items-center gap-1.5 text-lg font-semibold ${has ? "text-accent" : "text-muted"}`}>
                          {has ? <CheckIcon className="h-5 w-5 shrink-0" /> : <CircleIcon className="h-5 w-5 shrink-0" />}
                          {t(has ? "documents.added" : "documents.missing")}
                        </p>
                      )}
                    </div>

                    {mine.map((f) => (
                      <div key={f.pathname} className="space-y-3">
                        {fileDetails(f)}
                        <div className="flex flex-wrap gap-3">
                          {openLink(f)}
                          {!caregiver && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => pickFor(where, docId, f.pathname)}
                              className={outlineButton}
                            >
                              {t("documents.replace")}
                              <span className="sr-only"> {f.name}</span>
                            </button>
                          )}
                          {deleteButton(f, where)}
                        </div>
                      </div>
                    ))}

                    {known && !has && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => pickFor(where, docId)}
                        className="inline-flex min-h-12 w-full items-center justify-center text-center sm:w-auto rounded-xl bg-accent px-6 py-2 text-lg font-bold text-accent-ink disabled:opacity-60"
                      >
                        {t("documents.addCopy")}
                        <span className="sr-only"> {plainText(docName(docId))}</span>
                      </button>
                    )}

                    {statusMessage(where)}
                    {blankInfo(loc(DOCUMENTS[docId].blank))}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <section
        id="docs-other"
        aria-labelledby="doc-other"
        className="scroll-mt-24 space-y-5 rounded-xl border-2 border-line-strong bg-surface p-4 sm:p-6"
      >
        <div className="space-y-2">
          <h2 id="doc-other" tabIndex={-1} className="text-2xl font-bold text-accent outline-none">
            {t("documents.other")}
          </h2>
          <p className="text-lg text-muted">{t("documents.otherLead")}</p>
        </div>

        <form onSubmit={onOtherUpload} className="space-y-5" noValidate>
          <div className="space-y-2">
            <label htmlFor="file-input" className="block text-lg font-bold">
              {t("files.choose")}
            </label>
            <input
              ref={otherInputRef}
              id="file-input"
              type="file"
              accept={ACCEPT_ATTRIBUTE}
              className="block w-full min-w-0 rounded-xl border-2 border-line-strong bg-surface p-2 text-lg file:mb-2 file:mr-0 file:block file:w-full file:min-h-12 file:cursor-pointer file:rounded-lg file:border-0 file:bg-accent file:px-5 file:py-2 file:text-lg file:font-bold file:text-accent-ink"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-12 w-full items-center justify-center text-center sm:w-auto rounded-xl bg-accent px-6 py-3 text-lg font-bold text-accent-ink disabled:opacity-60"
          >
            {t("files.upload")}
          </button>
          {statusMessage("other")}
        </form>

        {known && otherFiles.length === 0 && <p className="text-lg text-muted">{t("files.none")}</p>}
        {otherFiles.length > 0 && (
          <ul className="space-y-3 border-t-2 border-line pt-5">
            {otherFiles.map((f) => (
              <li key={f.pathname} className="space-y-3 rounded-xl border-2 border-line p-3 sm:p-4">
                {fileDetails(f)}
                <div className="flex flex-wrap gap-3">
                  {openLink(f)}
                  {deleteButton(f, "other")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!caregiver && files && files.length > 1 && (
        <button type="button" disabled={busy} onClick={() => setTarget({ kind: "all" })} className={dangerButton}>
          {t("files.deleteAll")}
        </button>
      )}

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
                className="inline-flex min-h-12 w-full items-center justify-center text-center sm:w-auto rounded-xl border-2 border-danger bg-surface px-6 py-2 text-lg font-semibold text-danger hover:bg-hover-danger"
              >
                {t("files.confirmDelete")}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
