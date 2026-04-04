import { CRAWL_STATUS } from "@/features/crawl/domain/crawl-config";
import type {
  CrawlInput,
  CrawlResult,
  CrawlStatus,
} from "@/features/crawl/domain/crawl-config";

export interface CrawlProgress {
  pagesVisited: number;
  maxPages: number;
  currentUrl: string;
  pagesInQueue: number;
}

export interface CrawlJobRecord {
  id: string;
  status: CrawlStatus;
  config: CrawlInput;
  result: CrawlResult | null;
  error: string | null;
  progress: CrawlProgress;
  createdAt: string;
  updatedAt: string;
  cancelRequested: boolean;
}

export interface CrawlJobSnapshot {
  id: string;
  status: CrawlStatus;
  progress: CrawlProgress;
  result: CrawlResult | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export function createQueuedJob(
  id: string,
  config: CrawlInput,
  nowIso: string,
): CrawlJobRecord {
  return {
    id,
    status: CRAWL_STATUS.QUEUED,
    config,
    result: null,
    error: null,
    progress: {
      pagesVisited: 0,
      maxPages: config.maxPages,
      currentUrl: "",
      pagesInQueue: 0,
    },
    createdAt: nowIso,
    updatedAt: nowIso,
    cancelRequested: false,
  };
}

export function toJobSnapshot(job: CrawlJobRecord): CrawlJobSnapshot {
  return {
    id: job.id,
    status: job.status,
    progress: job.progress,
    result: job.result,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

export function isTerminalStatus(status: CrawlStatus): boolean {
  return (
    status === CRAWL_STATUS.COMPLETED ||
    status === CRAWL_STATUS.FAILED ||
    status === CRAWL_STATUS.CANCELLED
  );
}

export function isCancellableStatus(status: CrawlStatus): boolean {
  return status === CRAWL_STATUS.QUEUED || status === CRAWL_STATUS.RUNNING;
}
