import type { Locale } from "@/shared/i18n/locales";

interface AppMessagesShape {
  title: string;
  description: string;
  brandFull: string;
  brandShort: string;
}

const pt: AppMessagesShape = {
  title: "Route Mapper",
  description:
    "Descubra páginas, rotas de API, assets e requisições externas de qualquer site.",
  brandFull: "Route Mapper",
  brandShort: "Mapper",
};

const en: AppMessagesShape = {
  title: "Route Mapper",
  description:
    "Discover pages, API routes, assets, and external requests from any website.",
  brandFull: "Route Mapper",
  brandShort: "Mapper",
};

const messages = { "pt-BR": pt, en } as const;

export type AppMessages = AppMessagesShape;
export function getAppMessages(locale: Locale): AppMessages {
  return messages[locale];
}

// Static export for server components (metadata)
export const appMessages = pt;
