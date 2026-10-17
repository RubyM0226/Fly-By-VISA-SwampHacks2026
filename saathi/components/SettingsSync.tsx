"use client";

import { useEffect } from "react";
import { applySettingsToDocument, useSettings } from "@/lib/settings";

/** Keeps <html> attributes in step with the saved accessibility settings. */
export function SettingsSync() {
  const [settings] = useSettings();
  useEffect(() => {
    applySettingsToDocument(settings);
  }, [settings]);
  return null;
}
