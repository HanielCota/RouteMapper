"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useLocale } from "@/shared/i18n/locale-context";
import {
  getCrawlMessages,
  crawlMessages as defaultMessages,
  type CrawlMessages,
} from "@/features/crawl/presentation/crawl-messages";

const CrawlMessagesContext = createContext<CrawlMessages>(defaultMessages);

export function CrawlMessagesProvider({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const messages = getCrawlMessages(locale);

  return (
    <CrawlMessagesContext value={messages}>
      {children}
    </CrawlMessagesContext>
  );
}

export function useCrawlMessagesContext(): CrawlMessages {
  return useContext(CrawlMessagesContext);
}
