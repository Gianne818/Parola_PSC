import { useEffect, useState } from "react";
import en from "./translations/en";

export type Language = 'en' | 'tl' | 'ceb' | 'hil';

export type DictionaryKey = keyof typeof en;

type LocaleDict = Record<DictionaryKey, string>;

// Only English ships in the initial bundle. Other locales are split into
// separate chunks and loaded on demand (previously one 4-locale object).
const loaders: Record<Language, () => Promise<{ default: LocaleDict }>> = {
  en: () => import("./translations/en"),
  tl: () => import("./translations/tl"),
  ceb: () => import("./translations/ceb"),
  hil: () => import("./translations/hil"),
};

const cache: Partial<Record<Language, LocaleDict>> = { en: en as LocaleDict };

function preloadLocale(lang: Language): void {
  if (cache[lang]) return;
  loaders[lang]()
    .then((mod) => {
      cache[lang] = mod.default;
    })
    .catch(() => {
      // Offline or chunk failure: callers fall back to English.
    });
}

export function getTranslation(lang: Language, key: DictionaryKey): string {
  const translations = cache[lang];
  if (translations && translations[key]) return translations[key];
  return (en as LocaleDict)[key] ?? String(key);
}

export function useTranslation(lang: Language) {
  // Bumped when the active locale chunk arrives so labels re-render.
  const [, setVersion] = useState(0);

  useEffect(() => {
    if (cache[lang]) return;
    let live = true;
    loaders[lang]()
      .then((mod) => {
        cache[lang] = mod.default;
        if (live) setVersion((v) => v + 1);
      })
      .catch(() => {
        // Offline: stay on English fallback.
      });
    return () => {
      live = false;
    };
  }, [lang]);

  // Warm non-English chunks after first paint so later language switches
  // don't flash English. Idle-scheduled; initial bundle stays en-only.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    if (idle) {
      const id = idle(() => {
        (["tl", "ceb", "hil"] as const).forEach(preloadLocale);
      });
      return () => window.cancelIdleCallback?.(id);
    }
    const timer = setTimeout(() => {
      (["tl", "ceb", "hil"] as const).forEach(preloadLocale);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const t = (key: DictionaryKey) => getTranslation(lang, key);
  return { t, currentLang: lang };
}
