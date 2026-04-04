"use client";
"use no memo";

import { useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCrawlMessagesContext } from "@/features/crawl/presentation/crawl-messages-context";
import { EmptyState } from "@/features/crawl/presentation/results/empty-state";
import type { CrawlError } from "@/features/crawl/domain/crawl-config";

interface ErrorLogProps {
  errors: CrawlError[];
}

const ROW_HEIGHT = 56;

export function ErrorLog({ errors }: ErrorLogProps): React.JSX.Element {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const crawlMessages = useCrawlMessagesContext();
  const messages = crawlMessages.errorLog;

  const virtualizer = useVirtualizer({
    count: errors.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  if (errors.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title={messages.emptyTitle}
        description={messages.emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {messages.errorsFound(errors.length)}
      </p>

      <div
        ref={scrollContainerRef}
        className="max-h-96 overflow-y-auto rounded-md border"
      >
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const error = errors[virtualRow.index];
            return (
              <div
                key={virtualRow.index}
                className="flex flex-col justify-center gap-0.5 overflow-hidden border-b px-3 transition-colors duration-150 hover:bg-muted/30"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: virtualRow.size,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <p className="truncate font-mono text-xs text-primary">
                  {error.url}
                </p>
                <p className="truncate text-sm text-destructive">{error.message}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
