"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { DEFAULT_LOCALE, LOCALE, type Locale } from "@/shared/i18n/locales";

const STORAGE_KEY = "route_mapper_locale";
const LOCALE_CHANGE_EVENT = "route-mapper:locale-change";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
  toggleLocale: () => undefined,
});

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === LOCALE.EN || stored === LOCALE.PT) return stored;
  } catch {
    // ignore
  }

  return DEFAULT_LOCALE;
}

function writeStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}

function subscribeToLocaleStore(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent): void => {
    if (event.key !== STORAGE_KEY) {
      return;
    }

    onStoreChange();
  };

  const handleLocaleChange = (): void => {
    onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(LOCALE_CHANGE_EVENT, handleLocaleChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(LOCALE_CHANGE_EVENT, handleLocaleChange);
  };
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribeToLocaleStore,
    readStoredLocale,
    () => DEFAULT_LOCALE,
  );

  const setLocale = useCallback((next: Locale) => {
    writeStoredLocale(next);
    document.documentElement.lang = next;
    window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === LOCALE.PT ? LOCALE.EN : LOCALE.PT);
  }, [locale, setLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <LocaleContext value={{ locale, setLocale, toggleLocale }}>
      {children}
    </LocaleContext>
  );
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}
