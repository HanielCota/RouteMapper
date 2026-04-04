"use client";

import { useEffect, useRef } from "react";
import { Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCrawlMessagesContext } from "@/features/crawl/presentation/crawl-messages-context";
import type { CrawlProgress as CrawlProgressData } from "@/features/crawl/domain/crawl-job";

interface CrawlProgressProps {
  progress: CrawlProgressData | null;
  logs: ReadonlyArray<string>;
  onCancel: () => void;
}

export function CrawlProgress({
  progress,
  logs,
  onCancel,
}: CrawlProgressProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  const percent = progress
    ? Math.round((progress.pagesVisited / progress.maxPages) * 100)
    : 0;
  const crawlMessages = useCrawlMessagesContext();
  const messages = crawlMessages.progress;

  return (
    <div className="w-full max-w-4xl space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            {messages.scanning}
          </CardTitle>
          <Button variant="destructive" size="sm" onClick={onCancel}>
            <XCircle className="mr-1.5 h-4 w-4" />
            {messages.cancel}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={percent} className="[&_[data-slot=progress-track]]:h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {messages.pageOf(progress?.pagesVisited ?? 0, progress?.maxPages ?? 0)}
              {progress && progress.pagesInQueue > 0 ? (
                <span className="ml-1">{messages.inQueue(progress.pagesInQueue)}</span>
              ) : null}
            </span>
            <span className="tabular-nums">{percent}%</span>
          </div>
          {progress?.currentUrl ? (
            <p className="truncate text-sm text-muted-foreground">
              {messages.visiting}{" "}
              <span className="font-mono text-xs">{progress.currentUrl}</span>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {messages.liveLog}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 space-y-0.5 overflow-y-auto rounded-md bg-muted/50 p-3 font-mono text-xs sm:h-64">
            {logs.length === 0 ? (
              <p className="text-muted-foreground">{messages.waitingForLogs}</p>
            ) : null}
            {logs.map((log, index) => (
              <div key={`${index}-${log}`} className="break-all text-foreground/80">
                {log}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
