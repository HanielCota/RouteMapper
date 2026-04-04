import { isTerminalStatus } from "@/features/crawl/domain/crawl-job";
import type { CrawlJobRepository } from "@/features/crawl/application/ports";

export class TerminalCrawlRetentionPolicy {
  constructor(
    private readonly maxTerminalJobs: number,
    private readonly ttlMs: number,
  ) {}

  async prune(repository: CrawlJobRepository, nowMs: number): Promise<string[]> {
    const terminalJobs = [...(await repository.all())]
      .filter((job) => isTerminalStatus(job.status))
      .map((job) => ({
        id: job.id,
        updatedAtMs: new Date(job.updatedAt).getTime(),
      }));

    const removedIds: string[] = [];
    for (const job of terminalJobs) {
      if (nowMs - job.updatedAtMs <= this.ttlMs) {
        continue;
      }

      await repository.delete(job.id);
      removedIds.push(job.id);
    }

    const remainingTerminalJobs = terminalJobs
      .filter((job) => !removedIds.includes(job.id))
      .sort((left, right) => left.updatedAtMs - right.updatedAtMs);
    if (remainingTerminalJobs.length <= this.maxTerminalJobs) {
      return removedIds;
    }

    const overflowCount = remainingTerminalJobs.length - this.maxTerminalJobs;
    for (const job of remainingTerminalJobs.slice(0, overflowCount)) {
      await repository.delete(job.id);
      removedIds.push(job.id);
    }

    return removedIds;
  }
}
