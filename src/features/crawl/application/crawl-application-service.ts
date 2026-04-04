import { CRAWL_STATUS, SSE_EVENT_TYPE } from "@/features/crawl/domain/crawl-config";
import { createQueuedJob, isCancellableStatus, toJobSnapshot } from "@/features/crawl/domain/crawl-job";
import type { CrawlInput, DetectedLoginConfig } from "@/features/crawl/domain/crawl-config";
import type { CrawlEventListener } from "@/features/crawl/domain/crawl-event";
import type { CrawlJobSnapshot, CrawlProgress } from "@/features/crawl/domain/crawl-job";
import type {
  Clock,
  CrawlEventBus,
  CrawlExecutorPort,
  CrawlJobRepository,
  IdGenerator,
  LoginDetectorPort,
} from "@/features/crawl/application/ports";
import type { TerminalCrawlRetentionPolicy } from "@/features/crawl/application/terminal-crawl-retention-policy";

interface CrawlApplicationServiceDependencies {
  clock: Clock;
  ids: IdGenerator;
  jobs: CrawlJobRepository;
  events: CrawlEventBus;
  executor: CrawlExecutorPort;
  loginDetector: LoginDetectorPort;
  retentionPolicy: TerminalCrawlRetentionPolicy;
}

interface StartCrawlOptions {
  startInBackground?: boolean;
}

export class CrawlApplicationService {
  private readonly clock: Clock;
  private readonly ids: IdGenerator;
  private readonly jobs: CrawlJobRepository;
  private readonly events: CrawlEventBus;
  private readonly executor: CrawlExecutorPort;
  private readonly loginDetector: LoginDetectorPort;
  private readonly retentionPolicy: TerminalCrawlRetentionPolicy;
  private readonly activeAbortControllers = new Map<string, AbortController>();

  constructor(dependencies: CrawlApplicationServiceDependencies) {
    this.clock = dependencies.clock;
    this.ids = dependencies.ids;
    this.jobs = dependencies.jobs;
    this.events = dependencies.events;
    this.executor = dependencies.executor;
    this.loginDetector = dependencies.loginDetector;
    this.retentionPolicy = dependencies.retentionPolicy;
  }

  async startCrawl(config: CrawlInput, options?: StartCrawlOptions): Promise<string> {
    await this.pruneTerminalJobs();

    const job = createQueuedJob(this.ids.generate(), config, this.clock.nowIso());
    await this.jobs.save(job);
    if (options?.startInBackground ?? true) {
      void this.runCrawl(job.id);
    }

    return job.id;
  }

  async runCrawl(jobId: string): Promise<void> {
    await this.runJob(jobId);
  }

  async getCrawl(id: string): Promise<CrawlJobSnapshot | null> {
    const job = await this.jobs.get(id);
    if (!job) {
      return null;
    }

    return toJobSnapshot(job);
  }

  async cancelCrawl(id: string): Promise<boolean> {
    const job = await this.jobs.get(id);
    if (!job) {
      return false;
    }

    if (!isCancellableStatus(job.status)) {
      return false;
    }

    job.cancelRequested = true;
    job.status = CRAWL_STATUS.CANCELLED;
    job.updatedAt = this.clock.nowIso();
    await this.jobs.save(job);
    this.activeAbortControllers.get(id)?.abort();

    await this.events.publish(id, {
      type: SSE_EVENT_TYPE.DONE,
      data: { status: CRAWL_STATUS.CANCELLED },
    });

    return true;
  }

  async subscribeToCrawl(
    id: string,
    listener: CrawlEventListener,
  ): Promise<(() => void) | null> {
    const job = await this.jobs.get(id);
    if (!job) {
      return null;
    }

    return this.events.subscribe(id, listener);
  }

  async detectLogin(url: string): Promise<DetectedLoginConfig> {
    return this.loginDetector.detect(url);
  }

  private async pruneTerminalJobs(): Promise<void> {
    const removedIds = await this.retentionPolicy.prune(
      this.jobs,
      this.clock.now().getTime(),
    );

    for (const removedId of removedIds) {
      this.events.clear(removedId);
    }
  }

  private async runJob(jobId: string): Promise<void> {
    const job = await this.jobs.get(jobId);
    if (!job) {
      return;
    }

    if (
      job.cancelRequested ||
      job.status === CRAWL_STATUS.CANCELLED ||
      job.status !== CRAWL_STATUS.QUEUED
    ) {
      return;
    }

    const abortController = new AbortController();
    this.activeAbortControllers.set(jobId, abortController);
    job.status = CRAWL_STATUS.RUNNING;
    job.updatedAt = this.clock.nowIso();
    await this.jobs.save(job);

    try {
      const result = await this.executor.run(job.config, {
        signal: abortController.signal,
        onProgress: (progress) => this.handleProgress(jobId, progress),
        onLog: (message) => this.handleLog(jobId, message),
      });
      await this.completeJob(jobId, result);
    } catch (error: unknown) {
      await this.failJob(jobId, error);
    } finally {
      this.activeAbortControllers.delete(jobId);
    }
  }

  private handleProgress(jobId: string, progress: CrawlProgress): void {
    void this.jobs.get(jobId).then(async (job) => {
      if (!job) {
        return;
      }

      if (job.status === CRAWL_STATUS.CANCELLED || job.cancelRequested) {
        this.activeAbortControllers.get(jobId)?.abort();
        return;
      }

      job.progress = progress;
      job.updatedAt = this.clock.nowIso();
      await this.jobs.save(job);

      void this.events.publish(jobId, {
        type: SSE_EVENT_TYPE.PROGRESS,
        data: progress,
      });
    });
  }

  private handleLog(jobId: string, message: string): void {
    void this.jobs.get(jobId).then(async (job) => {
      if (!job) {
        return;
      }

      if (job.status === CRAWL_STATUS.CANCELLED || job.cancelRequested) {
        this.activeAbortControllers.get(jobId)?.abort();
        return;
      }

      job.updatedAt = this.clock.nowIso();
      await this.jobs.save(job);

      void this.events.publish(jobId, {
        type: SSE_EVENT_TYPE.LOG,
        data: { message },
      });
    });
  }

  private async completeJob(jobId: string, result: CrawlJobSnapshot["result"]): Promise<void> {
    const job = await this.jobs.get(jobId);
    if (!job) {
      return;
    }

    if (job.status === CRAWL_STATUS.CANCELLED) {
      return;
    }

    job.result = result;
    job.status = CRAWL_STATUS.COMPLETED;
    job.updatedAt = this.clock.nowIso();
    await this.jobs.save(job);

    await this.events.publish(jobId, {
      type: SSE_EVENT_TYPE.DONE,
      data: { status: CRAWL_STATUS.COMPLETED },
    });
  }

  private async failJob(jobId: string, error: unknown): Promise<void> {
    const job = await this.jobs.get(jobId);
    if (!job) {
      return;
    }

    if (job.status === CRAWL_STATUS.CANCELLED) {
      return;
    }

    const message = error instanceof Error ? error.message : String(error);
    job.error = message;
    job.status = CRAWL_STATUS.FAILED;
    job.updatedAt = this.clock.nowIso();
    await this.jobs.save(job);

    await this.events.publish(jobId, {
      type: SSE_EVENT_TYPE.ERROR,
      data: { message },
    });
    await this.events.publish(jobId, {
      type: SSE_EVENT_TYPE.DONE,
      data: { status: CRAWL_STATUS.FAILED },
    });
  }
}
