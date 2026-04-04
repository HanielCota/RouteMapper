import type { DetectedLoginConfig } from "@/features/crawl/domain/crawl-config";
import type { CrawlInput, CrawlResult } from "@/features/crawl/domain/crawl-config";
import type { CrawlEvent, CrawlEventListener } from "@/features/crawl/domain/crawl-event";
import type { CrawlJobRecord, CrawlProgress } from "@/features/crawl/domain/crawl-job";

export interface Clock {
  now(): Date;
  nowIso(): string;
}

export interface IdGenerator {
  generate(): string;
}

export interface CrawlJobRepository {
  save(job: CrawlJobRecord): Promise<void>;
  get(id: string): Promise<CrawlJobRecord | undefined>;
  delete(id: string): Promise<void>;
  all(): Promise<Iterable<CrawlJobRecord>>;
}

export interface CrawlEventBus {
  publish(jobId: string, event: CrawlEvent): Promise<void>;
  subscribe(jobId: string, listener: CrawlEventListener): () => void;
  clear(jobId: string): void;
}

export interface CrawlExecutionCallbacks {
  signal: AbortSignal;
  onProgress: (progress: CrawlProgress) => void;
  onLog: (message: string) => void;
}

export interface CrawlExecutorPort {
  run(config: CrawlInput, callbacks: CrawlExecutionCallbacks): Promise<CrawlResult>;
}

export interface LoginDetectorPort {
  detect(url: string): Promise<DetectedLoginConfig>;
}
