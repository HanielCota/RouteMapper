"use client";

import { useCallback, useEffect, useState } from "react";
import { CRAWL_STATUS, crawlJobSnapshotSchema } from "@/features/crawl/domain/crawl-config";
import { useCrawlMessagesContext } from "@/features/crawl/presentation/crawl-messages-context";
import type { CrawlJobSnapshot } from "@/features/crawl/domain/crawl-job";

class CrawlResultRequestError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "CrawlResultRequestError";
    this.statusCode = statusCode;
  }
}

interface UseCrawlResultReturn {
  data: CrawlJobSnapshot | null;
  isLoading: boolean;
  error: string | null;
  statusCode: number | null;
  refetch: () => void;
}

export function useCrawlResult(jobId: string | null): UseCrawlResultReturn {
  const crawlMessages = useCrawlMessagesContext();
  const invalidResponseMessage = crawlMessages.boundaries.invalidResponse;
  const [data, setData] = useState<CrawlJobSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [fetchCount, setFetchCount] = useState(0);

  const refetch = useCallback(() => {
    setFetchCount((currentCount) => currentCount + 1);
  }, []);

  useEffect(() => {
    if (!jobId) {
      return;
    }

    const controller = new AbortController();

    const fetchJob = async (): Promise<void> => {
      setIsLoading(true);
      setData((currentData) => (currentData?.id === jobId ? currentData : null));
      setError(null);
      setStatusCode(null);

      try {
        const response = await fetch(`/api/crawl/${jobId}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          const body = await response
            .json()
            .catch(() => ({ error: `HTTP ${response.status}` }));
          const message =
            body && typeof body.error === "string"
              ? body.error
              : `HTTP ${response.status}`;
          throw new CrawlResultRequestError(message, response.status);
        }

        const json = await response.json();
        const parsed = crawlJobSnapshotSchema.safeParse(json);
        if (!parsed.success) {
          throw new Error(invalidResponseMessage);
        }

        setData(parsed.data as CrawlJobSnapshot);
        setError(null);
        setStatusCode(null);
      } catch (error: unknown) {
        if (controller.signal.aborted) {
          return;
        }

        setData(null);
        setError(error instanceof Error ? error.message : String(error));
        setStatusCode(
          error instanceof CrawlResultRequestError ? error.statusCode : null,
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void fetchJob();

    return () => {
      controller.abort();
    };
  }, [fetchCount, invalidResponseMessage, jobId]);

  useEffect(() => {
    if (!jobId || !data) {
      return;
    }

    if (
      data.status !== CRAWL_STATUS.QUEUED &&
      data.status !== CRAWL_STATUS.RUNNING
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      setFetchCount((currentCount) => currentCount + 1);
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [data, jobId]);

  return { data, isLoading, error, statusCode, refetch };
}
