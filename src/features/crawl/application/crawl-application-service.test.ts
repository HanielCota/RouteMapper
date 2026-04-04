import { CrawlApplicationService } from "@/features/crawl/application/crawl-application-service";
import { TerminalCrawlRetentionPolicy } from "@/features/crawl/application/terminal-crawl-retention-policy";
import { CRAWL_STATUS } from "@/features/crawl/domain/crawl-config";
import { InMemoryCrawlEventBus } from "@/features/crawl/infrastructure/events/in-memory-crawl-event-bus";
import { InMemoryCrawlJobRepository } from "@/features/crawl/infrastructure/jobs/in-memory-crawl-job-repository";
import type {
  Clock,
  CrawlExecutionCallbacks,
  CrawlExecutorPort,
  IdGenerator,
  LoginDetectorPort,
} from "@/features/crawl/application/ports";
import type { CrawlInput, CrawlResult } from "@/features/crawl/domain/crawl-config";

const baseConfig: CrawlInput = {
  url: "https://example.com",
  maxPages: 5,
  maxClicksPerPage: 2,
  timeoutMs: 10000,
  navigationIdleTimeoutMs: 1000,
  interactionIdleTimeoutMs: 500,
  allowedHostsMode: "related",
};

const baseResult: CrawlResult = {
  summary: {
    startUrl: "https://example.com",
    pagesVisited: 1,
    pagesDiscovered: 1,
    apiRoutesDiscovered: 0,
    assetsObserved: 0,
    externalRequestsObserved: 0,
    errors: 0,
    scannedAt: "2026-04-03T00:00:00.000Z",
  },
  pageRoutes: [],
  apiRoutes: [],
  assetRequests: [],
  externalRequests: [],
  logs: [],
  errors: [],
};

class FakeClock implements Clock {
  constructor(private readonly currentDate: Date) {}

  now(): Date {
    return this.currentDate;
  }

  nowIso(): string {
    return this.currentDate.toISOString();
  }
}

class FakeIdGenerator implements IdGenerator {
  generate(): string {
    return "job-1";
  }
}

class FakeLoginDetector implements LoginDetectorPort {
  async detect() {
    return {
      loginUrl: "https://example.com/login",
      passwordSelector: "#password",
      submitSelector: "button[type='submit']",
      isPasswordOnly: false,
      usernameSelector: "#email",
    };
  }
}

function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("CrawlApplicationService", () => {
  it("runs a crawl, updates status and publishes progress/log/done events", async () => {
    const eventBus = new InMemoryCrawlEventBus();
    const executor: CrawlExecutorPort = {
      run: async (_config, callbacks: CrawlExecutionCallbacks) => {
        await flushPromises();
        callbacks.onProgress({
          pagesVisited: 1,
          maxPages: 5,
          currentUrl: "https://example.com/page",
          pagesInQueue: 0,
        });
        callbacks.onLog("Visited first page");
        return baseResult;
      },
    };

    const service = new CrawlApplicationService({
      clock: new FakeClock(new Date("2026-04-03T00:00:00.000Z")),
      ids: new FakeIdGenerator(),
      jobs: new InMemoryCrawlJobRepository(),
      events: eventBus,
      executor,
      loginDetector: new FakeLoginDetector(),
      retentionPolicy: new TerminalCrawlRetentionPolicy(5, 1000),
    });

    const receivedEvents: string[] = [];
    const jobId = await service.startCrawl(baseConfig);
    await service.subscribeToCrawl(jobId, (event) => {
      receivedEvents.push(event.type);
    });

    await flushPromises();

    const crawl = await service.getCrawl(jobId);
    expect(crawl?.status).toBe(CRAWL_STATUS.COMPLETED);
    expect(crawl?.result).toEqual(baseResult);
    expect(receivedEvents).toEqual(
      expect.arrayContaining(["progress", "log", "done"]),
    );
  });

  it("cancels a running crawl and keeps the terminal state after executor resolution", async () => {
    let resolveRun: ((result: CrawlResult) => void) | undefined;

    const executor: CrawlExecutorPort = {
      run: () =>
        new Promise<CrawlResult>((resolve) => {
          resolveRun = resolve;
        }),
    };

    const service = new CrawlApplicationService({
      clock: new FakeClock(new Date("2026-04-03T00:00:00.000Z")),
      ids: new FakeIdGenerator(),
      jobs: new InMemoryCrawlJobRepository(),
      events: new InMemoryCrawlEventBus(),
      executor,
      loginDetector: new FakeLoginDetector(),
      retentionPolicy: new TerminalCrawlRetentionPolicy(5, 1000),
    });

    const jobId = await service.startCrawl(baseConfig);
    expect(await service.cancelCrawl(jobId)).toBe(true);

    resolveRun?.(baseResult);
    await flushPromises();

    const crawl = await service.getCrawl(jobId);
    expect(crawl?.status).toBe(CRAWL_STATUS.CANCELLED);
    expect(crawl?.result).toBeNull();
  });

  it("removes stale terminal jobs through the retention policy boundary", async () => {
    const repository = new InMemoryCrawlJobRepository();
    await repository.save({
      id: "old-job",
      status: CRAWL_STATUS.COMPLETED,
      config: baseConfig,
      result: baseResult,
      error: null,
      progress: {
        pagesVisited: 1,
        maxPages: 5,
        currentUrl: "https://example.com",
        pagesInQueue: 0,
      },
      createdAt: "2026-04-03T00:00:00.000Z",
      updatedAt: "2026-04-03T00:00:00.000Z",
      cancelRequested: false,
    });

    const removedIds = await new TerminalCrawlRetentionPolicy(5, 1000).prune(
      repository,
      new Date("2026-04-03T00:00:02.000Z").getTime(),
    );

    expect(removedIds).toEqual(["old-job"]);
    expect(await repository.get("old-job")).toBeUndefined();
  });
});
