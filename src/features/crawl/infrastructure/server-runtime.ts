import "server-only";

import { CrawlApplicationService } from "@/features/crawl/application/crawl-application-service";
import { TerminalCrawlRetentionPolicy } from "@/features/crawl/application/terminal-crawl-retention-policy";
import { InMemoryCrawlEventBus } from "@/features/crawl/infrastructure/events/in-memory-crawl-event-bus";
import { FileCrawlJobRepository } from "@/features/crawl/infrastructure/jobs/file-crawl-job-repository";
import { PlaywrightAuthenticator } from "@/features/crawl/infrastructure/playwright/playwright-authenticator";
import { PlaywrightBrowserFactory } from "@/features/crawl/infrastructure/playwright/playwright-browser-factory";
import { PlaywrightCrawlExecutor } from "@/features/crawl/infrastructure/playwright/playwright-crawl-executor";
import { PlaywrightLoginDetector } from "@/features/crawl/infrastructure/playwright/playwright-login-detector";
import { SystemClock } from "@/features/crawl/infrastructure/system/system-clock";
import { UuidIdGenerator } from "@/features/crawl/infrastructure/system/uuid-id-generator";

const TERMINAL_JOB_LIMIT = 50;
const TERMINAL_JOB_TTL_MS = 30 * 60 * 1000;

declare global {
  var __routeMapperCrawlService: CrawlApplicationService | undefined;
}

function createCrawlService(): CrawlApplicationService {
  const browserFactory = new PlaywrightBrowserFactory();
  const authenticator = new PlaywrightAuthenticator();

  return new CrawlApplicationService({
    clock: new SystemClock(),
    ids: new UuidIdGenerator(),
    jobs: new FileCrawlJobRepository(),
    events: new InMemoryCrawlEventBus(),
    executor: new PlaywrightCrawlExecutor(browserFactory, authenticator),
    loginDetector: new PlaywrightLoginDetector(browserFactory),
    retentionPolicy: new TerminalCrawlRetentionPolicy(
      TERMINAL_JOB_LIMIT,
      TERMINAL_JOB_TTL_MS,
    ),
  });
}

export function getCrawlService(): CrawlApplicationService {
  if (
    globalThis.__routeMapperCrawlService &&
    typeof globalThis.__routeMapperCrawlService.runCrawl === "function"
  ) {
    return globalThis.__routeMapperCrawlService;
  }

  const crawlService = createCrawlService();
  globalThis.__routeMapperCrawlService = crawlService;
  return crawlService;
}
