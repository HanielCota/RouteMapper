import "server-only";

import type { CrawlJobRepository } from "@/features/crawl/application/ports";
import type { CrawlJobRecord } from "@/features/crawl/domain/crawl-job";

export class InMemoryCrawlJobRepository implements CrawlJobRepository {
  private readonly jobs = new Map<string, CrawlJobRecord>();

  async save(job: CrawlJobRecord): Promise<void> {
    this.jobs.set(job.id, job);
  }

  async get(id: string): Promise<CrawlJobRecord | undefined> {
    return this.jobs.get(id);
  }

  async delete(id: string): Promise<void> {
    this.jobs.delete(id);
  }

  async all(): Promise<Iterable<CrawlJobRecord>> {
    return this.jobs.values();
  }
}
