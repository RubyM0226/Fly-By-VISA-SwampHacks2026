import { createPersistedStore, useStore } from "./store";
import { SETTINGS_KEY } from "./settingsScript";

export type Lang = "en" | "hi";

export interface Settings {
  lang: Lang;
  /** -2, -1 = smaller; 0 = the default A; 1 = A+, 2 = A++, 3 = A+++ */
  textSize: -2 | -1 | 0 | 1 | 2 | 3;
  highContrast: boolean;
  monochrome: boolean;
  dyslexiaFont: boolean;
  /** 0 = normal, 1 = wide, 2 = extra wide */
  spacing: 0 | 1 | 2;
  boldText: boolean;
  underlineLinks: boolean;
  highlightLinks: boolean;
  pauseMotion: boolean;
  showDefinitions: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  lang: "en",
  textSize: 0,
  highContrast: false,
  monochrome: false,
  dyslexiaFont: false,
  spacing: 0,
  boldText: false,
  underlineLinks: false,
  highlightLinks: false,
  pauseMotion: false,
  showDefinitions: true,
};

export const settingsStore = createPersistedStore<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS);

export function useSettings() {
  return useStore(settingsStore);
}

/** Applies settings to <html>. Used by SettingsSync after hydration. */
export function applySettingsToDocument(s: Settings) {
  const d = document.documentElement;
  d.lang = s.lang;
  d.dataset.textSize = String(s.textSize);
  d.dataset.contrast = s.highContrast ? "high" : "normal";
  d.dataset.mono = String(s.monochrome);
  d.dataset.dyslexia = String(s.dyslexiaFont);
  d.dataset.spacing = String(s.spacing);
  d.dataset.bold = String(s.boldText);
  d.dataset.underline = String(s.underlineLinks);
  d.dataset.highlight = String(s.highlightLinks);
  d.dataset.motion = s.pauseMotion ? "paused" : "normal";
}
