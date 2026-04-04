"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCrawlMessagesContext } from "@/features/crawl/presentation/crawl-messages-context";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const messages = useCrawlMessagesContext().boundaries;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="space-y-4 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" aria-hidden />
        <h2 className="text-xl font-bold">{messages.errorTitle}</h2>
        <p className="max-w-md leading-relaxed text-muted-foreground">
          {error.message || messages.errorFallback}
        </p>
        <Button onClick={reset}>{messages.tryAgain}</Button>
      </div>
    </main>
  );
}
