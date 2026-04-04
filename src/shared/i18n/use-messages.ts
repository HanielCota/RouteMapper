"use client";

import { useLocale } from "@/shared/i18n/locale-context";
import { getAppMessages, type AppMessages } from "@/shared/messages/app-messages";
import { getThemeMessages, type ThemeMessages } from "@/shared/messages/theme-messages";

export function useAppMessages(): AppMessages {
  const { locale } = useLocale();
  return getAppMessages(locale);
}

export function useThemeMessages(): ThemeMessages {
  const { locale } = useLocale();
  return getThemeMessages(locale);
}
