"use client";

import { speak, stopSpeaking, useSpeakingOwner, useSpeechSupported } from "@/lib/speech";
import { useT } from "@/lib/i18n";
import { SpeakerIcon, StopIcon } from "./Icons";

interface Props {
  /** Unique id so only the button that started speech shows "stop". */
  ownerId: string;
  /** Text to read, gathered at click time. */
  getText: () => string;
  className?: string;
}

/** A speaker icon that reads a box aloud. Placed next to the box's title. */
export function SpeakButton({ ownerId, getText, className = "" }: Props) {
  const { t, lang } = useT();
  const supported = useSpeechSupported();
  const active = useSpeakingOwner() === ownerId;
  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => (active ? stopSpeaking() : speak(getText(), lang, ownerId))}
      aria-pressed={active}
      aria-label={active ? t("nav.stopReading") : t("nav.readAloud")}
      title={active ? t("nav.stopReading") : t("nav.readAloud")}
      className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-line-strong bg-surface hover:bg-accent-soft ${
        active ? "border-accent bg-accent-soft text-accent" : ""
      } ${className}`}
    >
      {active ? <StopIcon className="h-6 w-6" /> : <SpeakerIcon className="h-6 w-6" />}
    </button>
  );
}
