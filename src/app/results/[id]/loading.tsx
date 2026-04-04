"use client";

import { Loader2 } from "lucide-react";
import { useCrawlMessagesContext } from "@/features/crawl/presentation/crawl-messages-context";

export default function ResultsLoading() {
  const messages = useCrawlMessagesContext().boundaries;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
      <p className="mt-4 text-muted-foreground">{messages.loading}</p>
    </main>
  );
}
