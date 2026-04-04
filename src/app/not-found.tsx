"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCrawlMessagesContext } from "@/features/crawl/presentation/crawl-messages-context";

export default function NotFound() {
  const messages = useCrawlMessagesContext().boundaries;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="space-y-4 text-center">
        <h2 className="text-4xl font-bold tabular-nums">{messages.notFoundCode}</h2>
        <p className="max-w-md leading-relaxed text-muted-foreground">
          {messages.notFoundMessage}
        </p>
        <Link href="/">
          <Button>{messages.backToHome}</Button>
        </Link>
      </div>
    </main>
  );
}
