import { afterEach, describe, expect, it, vi } from "vitest";
import { CRAWL_STATUS } from "@/features/crawl/domain/crawl-config";
import type { CrawlEventListener } from "@/features/crawl/domain/crawl-event";

const { getCrawlMock, subscribeToCrawlMock } = vi.hoisted(() => ({
  getCrawlMock: vi.fn(),
  subscribeToCrawlMock: vi.fn(),
}));

vi.mock("@/features/crawl/infrastructure/server-runtime", () => ({
  getCrawlService: () => ({
    getCrawl: getCrawlMock,
    subscribeToCrawl: subscribeToCrawlMock,
  }),
}));

import { GET } from "./route";

describe("GET /api/crawl/[id]/stream", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("streams the initial progress and subsequent terminal event", async () => {
    let listener: CrawlEventListener | undefined;
    subscribeToCrawlMock.mockImplementation(
      async (_jobId: string, nextListener: CrawlEventListener) => {
        listener = nextListener;
        return () => {
          listener = undefined;
        };
      },
    );
    getCrawlMock.mockResolvedValue({
      id: "job-123",
      status: CRAWL_STATUS.RUNNING,
      progress: {
        pagesVisited: 1,
        maxPages: 5,
        currentUrl: "https://example.com",
        pagesInQueue: 1,
      },
      result: null,
      error: null,
      createdAt: "2026-04-03T00:00:00.000Z",
      updatedAt: "2026-04-03T00:00:00.000Z",
    });

    const response = await GET(
      new Request("http://localhost/api/crawl/job-123/stream"),
      { params: Promise.resolve({ id: "job-123" }) } as never,
    );
    const reader = response.body?.getReader();
    expect(reader).toBeDefined();

    const decoder = new TextDecoder();
    const firstChunk = await reader!.read();
    expect(decoder.decode(firstChunk.value)).toContain('"type":"progress"');

    listener?.({
      type: "done",
      data: { status: CRAWL_STATUS.COMPLETED },
    });

    const secondChunk = await reader!.read();
    expect(decoder.decode(secondChunk.value)).toContain('"type":"done"');

    const completion = await reader!.read();
    expect(completion.done).toBe(true);
  });
});
