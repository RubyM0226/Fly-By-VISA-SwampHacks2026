"use client";

import { speak, stopSpeaking, useSpeakingOwner, useSpeechSupported } from "@/lib/speech";
import { useT } from "@/lib/i18n";
import { SpeakerIcon, StopIcon } from "./Icons";

interface Props {
  /** Unique id so only the button that started speech shows "stop". */
  ownerId: string;
  /** Text to read. Pass a function to read it at click time (for whole-page reading). */
  getText: () => string;
  label: string;
  className?: string;
}

export function SpeakButton({ ownerId, getText, label, className = "" }: Props) {
  const { t, lang } = useT();
  const supported = useSpeechSupported();
  const active = useSpeakingOwner() === ownerId;
  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => (active ? stopSpeaking() : speak(getText(), lang, ownerId))}
      aria-pressed={active}
      className={`inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-line-strong bg-surface px-4 py-2 font-semibold hover:bg-accent-soft ${className}`}
    >
      {active ? <StopIcon className="h-5 w-5" /> : <SpeakerIcon className="h-5 w-5" />}
      <span>{active ? t("nav.stopReading") : label}</span>
    </button>
  );
}
