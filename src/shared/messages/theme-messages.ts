import type { Locale } from "@/shared/i18n/locales";

interface ThemeMessagesShape {
  switchToLight: string;
  switchToDark: string;
}

const pt: ThemeMessagesShape = {
  switchToLight: "Mudar para tema claro",
  switchToDark: "Mudar para tema escuro",
};

const en: ThemeMessagesShape = {
  switchToLight: "Switch to light theme",
  switchToDark: "Switch to dark theme",
};

const messages = { "pt-BR": pt, en } as const;

export type ThemeMessages = ThemeMessagesShape;
export function getThemeMessages(locale: Locale): ThemeMessages {
  return messages[locale];
}
