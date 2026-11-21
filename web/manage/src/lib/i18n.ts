import { useSyncExternalStore } from "react";
import { VI } from "@/i18n/vi";
import { ZH } from "@/i18n/zh";

/**
 * Tiny i18n. English is the source language: the English text IS the key, `t("Save")`.
 * Vietnamese lives in `src/i18n/vi/*.ts`, Simplified Chinese in `src/i18n/zh/*.ts`
 * (English text -> translation). A missing entry falls back to the English text.
 * `{name}` placeholders are filled from the second argument: `t("Sent to {n} devices", { n: 3 })`.
 * Call `t` at render time (never at module load) so a language change shows up; data tables keep English text
 * and call `t(label)` where they render it.
 */
export type Language = "en" | "vi" | "zh";
export const LANGUAGES: { id: Language; label: string }[] = [
  { id: "en", label: "English" },
  { id: "vi", label: "Tiếng Việt" },
  { id: "zh", label: "简体中文" },
];

const KEY = "pd.manage.lang";
const DICTS: { [lang: string]: Record<string, string> } = { vi: VI, zh: ZH };
/** Last language shown (browser only): avoids a flash of English before the layout loads. */
function initial(): Language {
  try {
    const s = localStorage.getItem(KEY);
    if (s === "vi" || s === "zh") return s;
    // First visit, before the layout arrives: follow the browser's language.
    const n = (navigator.language || "").toLowerCase();
    return n.startsWith("zh") ? "zh" : n.startsWith("vi") ? "vi" : "en";
  } catch {
    return "en";
  }
}
let current: Language = initial();
const listeners = new Set<() => void>();

export const getLanguage = (): Language => current;
export function setLanguage(l: Language): void {
  if (l === current) return;
  current = l;
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* storage unavailable */
  }
  try {
    document.documentElement.lang = l;
  } catch {
    /* no document (tests) */
  }
  listeners.forEach((f) => f());
}
/** Normalises whatever the agent stored: "vi" and "zh" are the extra languages, anything else is English. */
export const asLanguage = (v: unknown): Language => (v === "vi" ? "vi" : v === "zh" ? "zh" : "en");

export function t(text: string, params?: Record<string, string | number>): string {
  const dict = DICTS[current];
  const base = dict ? dict[text] ?? text : text;
  return params ? base.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m)) : base;
}

/** Re-renders the calling component when the language changes. */
export function useLanguage(): Language {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => "en",
  );
}
