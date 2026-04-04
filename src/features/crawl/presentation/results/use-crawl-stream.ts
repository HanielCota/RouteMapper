"use client";

import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import { SSE_EVENT_TYPE, crawlEventSchema } from "@/features/crawl/domain/crawl-config";
import { useCrawlMessagesContext } from "@/features/crawl/presentation/crawl-messages-context";
import type { CrawlEvent } from "@/features/crawl/domain/crawl-event";
import type { CrawlProgress } from "@/features/crawl/domain/crawl-job";
import type { CrawlStatus } from "@/features/crawl/domain/crawl-config";

const MAX_LOGS = 500;

interface UseCrawlStreamReturn {
  progress: CrawlProgress | null;
  logs: ReadonlyArray<string>;
  status: CrawlStatus | null;
  error: string | null;
  isConnected: boolean;
}

interface UseCrawlStreamOptions {
  disabled?: boolean;
}

export function useCrawlStream(
  jobId: string | null,
  options: UseCrawlStreamOptions = {},
): UseCrawlStreamReturn {
  const [progress, setProgress] = useState<CrawlProgress | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<CrawlStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const isClosedRef = useRef(false);

  const handleStreamEvent = useEffectEvent(
    (streamEvent: CrawlEvent, eventSource: EventSource): void => {
      if (streamEvent.type === SSE_EVENT_TYPE.PROGRESS) {
        setProgress(streamEvent.data);
        return;
      }

      if (streamEvent.type === SSE_EVENT_TYPE.LOG) {
        setLogs((currentLogs) => {
          const nextLogs = [...currentLogs, streamEvent.data.message];
          if (nextLogs.length <= MAX_LOGS) {
            return nextLogs;
          }

          return nextLogs.slice(-MAX_LOGS);
        });
        return;
      }

      if (streamEvent.type === SSE_EVENT_TYPE.ERROR) {
        setError(streamEvent.data.message);
        return;
      }

      setStatus(streamEvent.data.status);
      eventSource.close();
      setIsConnected(false);
    },
  );

  useEffect(() => {
    if (options.disabled) {
      return;
    }

    if (!jobId) {
      return;
    }

    isClosedRef.current = false;

    const eventSource = new EventSource(`/api/crawl/${jobId}/stream`);

    eventSource.onopen = () => {
      if (isClosedRef.current) {
        return;
      }

      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      if (isClosedRef.current) {
        return;
      }

      try {
        const parsed = crawlEventSchema.safeParse(JSON.parse(event.data));
        if (!parsed.success) {
          return;
        }

        handleStreamEvent(parsed.data as CrawlEvent, eventSource);
      } catch {
        return;
      }
    };

    eventSource.onerror = () => {
      if (isClosedRef.current) {
        return;
      }

      setIsConnected(false);
    };

    return () => {
      isClosedRef.current = true;
      eventSource.close();
      setIsConnected(false);
    };
  }, [jobId, options.disabled]);

  if (options.disabled) {
    return {
      progress: null,
      logs: [],
      status: null,
      error: null,
      isConnected: false,
    };
  }

  return { progress, logs, status, error, isConnected };
}

export function useCancelCrawl(): (jobId: string) => Promise<void> {
  const crawlMessages = useCrawlMessagesContext();

  return useCallback(async (jobId: string) => {
    const response = await fetch(`/api/crawl/${jobId}`, { method: "DELETE" });
    if (!response.ok) {
      throw new Error(crawlMessages.boundaries.cancelFailed(response.status));
    }
  }, [crawlMessages]);
}
