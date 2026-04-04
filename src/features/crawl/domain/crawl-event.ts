import { SSE_EVENT_TYPE } from "@/features/crawl/domain/crawl-config";
import type { CrawlStatus } from "@/features/crawl/domain/crawl-config";
import type { CrawlProgress } from "@/features/crawl/domain/crawl-job";

export interface CrawlProgressEvent {
  type: typeof SSE_EVENT_TYPE.PROGRESS;
  data: CrawlProgress;
}

export interface CrawlLogEvent {
  type: typeof SSE_EVENT_TYPE.LOG;
  data: { message: string };
}

export interface CrawlDoneEvent {
  type: typeof SSE_EVENT_TYPE.DONE;
  data: { status: CrawlStatus };
}

export interface CrawlErrorEvent {
  type: typeof SSE_EVENT_TYPE.ERROR;
  data: { message: string };
}

export type CrawlEvent =
  | CrawlProgressEvent
  | CrawlLogEvent
  | CrawlDoneEvent
  | CrawlErrorEvent;

export type CrawlEventListener = (event: CrawlEvent) => void;
