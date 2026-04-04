import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { CRAWL_STATUS } from "@/features/crawl/domain/crawl-config";
import { FileCrawlJobRepository } from "@/features/crawl/infrastructure/jobs/file-crawl-job-repository";
import type { CrawlInput } from "@/features/crawl/domain/crawl-config";
import type { CrawlJobRecord } from "@/features/crawl/domain/crawl-job";

const tempDirectories: string[] = [];

const baseConfig: CrawlInput = {
  url: "https://example.com",
  maxPages: 5,
  maxClicksPerPage: 2,
  timeoutMs: 10000,
  navigationIdleTimeoutMs: 1000,
  interactionIdleTimeoutMs: 500,
  allowedHostsMode: "related",
};

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("FileCrawlJobRepository", () => {
  it("returns the latest valid snapshot for a job", async () => {
    const storageDirectory = await createStorageDirectory();
    const repository = new FileCrawlJobRepository(storageDirectory);

    await repository.save(createJob("job-1", CRAWL_STATUS.QUEUED, "2026-04-03T00:00:00.000Z"));
    await repository.save(createJob("job-1", CRAWL_STATUS.RUNNING, "2026-04-03T00:00:01.000Z"));

    const snapshot = await repository.get("job-1");

    expect(snapshot?.status).toBe(CRAWL_STATUS.RUNNING);
    expect(snapshot?.updatedAt).toBe("2026-04-03T00:00:01.000Z");
  });

  it("skips corrupt snapshots and legacy files when a valid snapshot exists", async () => {
    const storageDirectory = await createStorageDirectory();
    const repository = new FileCrawlJobRepository(storageDirectory);

    await writeFile(path.join(storageDirectory, "job-1.json"), "{\"broken\":true}}", "utf8");
    await writeFile(
      path.join(storageDirectory, "job-1__9999999999999__1__corrupt.json"),
      "{\"broken\":true}}",
      "utf8",
    );
    await repository.save(
      createJob("job-1", CRAWL_STATUS.COMPLETED, "2026-04-03T00:00:02.000Z"),
    );

    const snapshot = await repository.get("job-1");

    expect(snapshot?.status).toBe(CRAWL_STATUS.COMPLETED);
    expect(snapshot?.updatedAt).toBe("2026-04-03T00:00:02.000Z");
  });

  it("deduplicates jobs in all() and deletes every snapshot for a job", async () => {
    const storageDirectory = await createStorageDirectory();
    const repository = new FileCrawlJobRepository(storageDirectory);

    await repository.save(createJob("job-1", CRAWL_STATUS.QUEUED, "2026-04-03T00:00:00.000Z"));
    await repository.save(createJob("job-1", CRAWL_STATUS.RUNNING, "2026-04-03T00:00:01.000Z"));
    await repository.save(
      createJob("job-2", CRAWL_STATUS.COMPLETED, "2026-04-03T00:00:02.000Z"),
    );

    const jobs = Array.from(await repository.all()).sort((left, right) =>
      left.id.localeCompare(right.id),
    );

    expect(jobs).toEqual([
      expect.objectContaining({ id: "job-1", status: CRAWL_STATUS.RUNNING }),
      expect.objectContaining({ id: "job-2", status: CRAWL_STATUS.COMPLETED }),
    ]);

    await repository.delete("job-1");

    expect(await repository.get("job-1")).toBeUndefined();
    expect((await readdir(storageDirectory)).some((fileName) => fileName.startsWith("job-1"))).toBe(
      false,
    );
  });
});

async function createStorageDirectory(): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), "route-mapper-jobs-test-"));
  tempDirectories.push(directory);
  return directory;
}

function createJob(
  id: string,
  status: CrawlJobRecord["status"],
  updatedAt: string,
): CrawlJobRecord {
  return {
    id,
    status,
    config: baseConfig,
    result: null,
    error: null,
    progress: {
      pagesVisited: 0,
      maxPages: baseConfig.maxPages,
      currentUrl: "",
      pagesInQueue: 0,
    },
    createdAt: "2026-04-03T00:00:00.000Z",
    updatedAt,
    cancelRequested: false,
  };
}
