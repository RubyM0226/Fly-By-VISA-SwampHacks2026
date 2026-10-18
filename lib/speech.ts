import { useSyncExternalStore } from "react";
import type { Lang } from "./settings";
import { SPEECH_TAG } from "./locale";

// Read-aloud using the browser's built-in speech (no key, nothing sent anywhere).
// Hindi needs a Hindi voice installed on the device; most Android phones and
// Chrome on desktop have one.

let owner: string | null = null;
let session = 0;
const listeners = new Set<() => void>();

function setOwner(next: string | null) {
  owner = next;
  listeners.forEach((l) => l());
}

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Long utterances get cut off in some browsers, so speak in short chunks. */
function chunk(text: string, max = 220): string[] {
  const sentences = text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?।])\s+/);
  const out: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if (!s) continue;
    if ((cur + " " + s).trim().length > max && cur) {
      out.push(cur);
      cur = s;
    } else {
      cur = (cur + " " + s).trim();
    }
  }
  if (cur) out.push(cur);
  return out;
}

export function stopSpeaking() {
  if (!speechSupported()) return;
  session += 1;
  window.speechSynthesis.cancel();
  setOwner(null);
}

export function speak(text: string, lang: Lang, ownerId: string) {
  if (!speechSupported()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const pieces = chunk(text);
  if (pieces.length === 0) return;

  session += 1;
  const mine = session;
  const tag = SPEECH_TAG[lang];
  const voices = synth.getVoices();
  const voice =
    voices.find((v) => v.lang.replace("_", "-").toLowerCase() === tag.toLowerCase()) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(lang));

  let remaining = pieces.length;
  const finish = () => {
    if (session === mine) setOwner(null);
  };
  pieces.forEach((p) => {
    const u = new SpeechSynthesisUtterance(p);
    u.lang = tag;
    if (voice) u.voice = voice;
    u.rate = 0.9;
    u.onend = () => {
      remaining -= 1;
      if (remaining === 0) finish();
    };
    u.onerror = finish;
    synth.speak(u);
  });
  setOwner(ownerId);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Id of whatever is being read right now, or null. */
export function useSpeakingOwner(): string | null {
  return useSyncExternalStore(subscribe, () => owner, () => null);
}

const noop = () => () => {};
export function useSpeechSupported(): boolean {
  return useSyncExternalStore(noop, speechSupported, () => false);
}
