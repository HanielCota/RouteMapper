export const LOCALE = {
  PT: "pt-BR",
  EN: "en",
} as const;

export type Locale = (typeof LOCALE)[keyof typeof LOCALE];

export const DEFAULT_LOCALE: Locale = LOCALE.PT;
