import "server-only";

import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import type { CrawlJobRepository } from "@/features/crawl/application/ports";
import type { CrawlJobRecord } from "@/features/crawl/domain/crawl-job";

type PersistedCrawlJobRecord = Omit<CrawlJobRecord, never>;

const STORAGE_DIRECTORY = path.join(tmpdir(), "route-mapper", "crawl-jobs");
const SNAPSHOT_FILE_SEPARATOR = "__";
const SNAPSHOT_RETENTION_PER_JOB = 5;

export class FileCrawlJobRepository implements CrawlJobRepository {
  constructor(private readonly storageDirectory: string = STORAGE_DIRECTORY) {}

  async save(job: CrawlJobRecord): Promise<void> {
    await this.ensureStorageDirectory();

    const snapshotPath = this.getSnapshotFilePath(job.id);
    const tempPath = `${snapshotPath}.tmp`;
    const persistedJob: PersistedCrawlJobRecord = structuredClone(job);

    await writeFile(tempPath, JSON.stringify(persistedJob), "utf8");
    await rename(tempPath, snapshotPath);
    await this.pruneOldSnapshots(job.id);
  }

  async get(id: string): Promise<CrawlJobRecord | undefined> {
    const snapshotPaths = await this.getSnapshotPaths(id);

    for (const snapshotPath of snapshotPaths) {
      const job = await this.readJobSnapshot(snapshotPath);
      if (job) {
        return job;
      }
    }

    return undefined;
  }

  async delete(id: string): Promise<void> {
    const snapshotPaths = await this.getSnapshotPaths(id);
    await Promise.all(snapshotPaths.map((snapshotPath) => rm(snapshotPath, { force: true })));
  }

  async all(): Promise<Iterable<CrawlJobRecord>> {
    await this.ensureStorageDirectory();

    const fileNames = await readdir(this.storageDirectory);
    const snapshotPaths = fileNames
      .filter((fileName) => fileName.endsWith(".json"))
      .sort(compareSnapshotFileNamesDesc)
      .map((fileName) => path.join(this.storageDirectory, fileName));
    const jobsById = new Map<string, CrawlJobRecord>();

    for (const snapshotPath of snapshotPaths) {
      const job = await this.readJobSnapshot(snapshotPath);
      if (!job || jobsById.has(job.id)) {
        continue;
      }

      jobsById.set(job.id, job);
    }

    return jobsById.values();
  }

  private async ensureStorageDirectory(): Promise<void> {
    await mkdir(this.storageDirectory, { recursive: true });
  }

  private getSnapshotFilePath(id: string): string {
    const snapshotId = randomUUID();
    const fileName = [
      id,
      Date.now().toString(),
      process.pid.toString(),
      snapshotId,
    ].join(SNAPSHOT_FILE_SEPARATOR);

    return path.join(this.storageDirectory, `${fileName}.json`);
  }

  private async getSnapshotPaths(id: string): Promise<string[]> {
    await this.ensureStorageDirectory();

    const legacyFilePath = this.getLegacyJobFilePath(id);

    try {
      const fileNames = await readdir(this.storageDirectory);
      return fileNames
        .filter(
          (fileName) =>
            fileName === path.basename(legacyFilePath) ||
            fileName.startsWith(`${id}${SNAPSHOT_FILE_SEPARATOR}`),
        )
        .sort(compareSnapshotFileNamesDesc)
        .map((fileName) => path.join(this.storageDirectory, fileName));
    } catch (error: unknown) {
      if (isMissingFileError(error)) {
        return [];
      }

      throw error;
    }
  }

  private async readJobSnapshot(snapshotPath: string): Promise<CrawlJobRecord | null> {
    try {
      const raw = await readFile(snapshotPath, "utf8");
      return JSON.parse(raw) as CrawlJobRecord;
    } catch (error: unknown) {
      if (isMissingFileError(error) || isJsonParseError(error)) {
        return null;
      }

      throw error;
    }
  }

  private async pruneOldSnapshots(id: string): Promise<void> {
    const snapshotPaths = await this.getSnapshotPaths(id);
    const snapshotsToDelete = snapshotPaths.slice(SNAPSHOT_RETENTION_PER_JOB);

    await Promise.all(
      snapshotsToDelete.map((snapshotPath) => rm(snapshotPath, { force: true })),
    );
  }

  private getLegacyJobFilePath(id: string): string {
    return path.join(this.storageDirectory, `${id}.json`);
  }
}

function compareSnapshotFileNamesDesc(left: string, right: string): number {
  const timestampDifference = getSnapshotTimestamp(right) - getSnapshotTimestamp(left);
  if (timestampDifference !== 0) {
    return timestampDifference;
  }

  return right.localeCompare(left);
}

function getSnapshotTimestamp(fileName: string): number {
  const baseName = path.basename(fileName, ".json");
  const [, timestamp] = baseName.split(SNAPSHOT_FILE_SEPARATOR);
  const parsedTimestamp = Number.parseInt(timestamp ?? "", 10);

  return Number.isFinite(parsedTimestamp) ? parsedTimestamp : 0;
}

function isJsonParseError(error: unknown): error is SyntaxError {
  return error instanceof SyntaxError;
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
