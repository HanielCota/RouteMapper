import { afterEach, describe, expect, it, vi } from "vitest";
import { apiErrorMessages } from "@/shared/messages/api-error-messages";

const { getCrawlMock, cancelCrawlMock } = vi.hoisted(() => ({
  getCrawlMock: vi.fn(),
  cancelCrawlMock: vi.fn(),
}));

vi.mock("@/features/crawl/infrastructure/server-runtime", () => ({
  getCrawlService: () => ({
    getCrawl: getCrawlMock,
    cancelCrawl: cancelCrawlMock,
  }),
}));

import { DELETE, GET } from "./route";

describe("/api/crawl/[id] handlers", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns the crawl snapshot when the job exists", async () => {
    getCrawlMock.mockResolvedValue({
      id: "job-123",
      status: "running",
      progress: {
        pagesVisited: 1,
        maxPages: 5,
        currentUrl: "https://example.com",
        pagesInQueue: 2,
      },
      result: null,
      error: null,
      createdAt: "2026-04-03T00:00:00.000Z",
      updatedAt: "2026-04-03T00:00:00.000Z",
    });

    const response = await GET(
      new Request("http://localhost/api/crawl/job-123"),
      { params: Promise.resolve({ id: "job-123" }) } as never,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ id: "job-123" });
  });

  it("returns not found when cancellation is not possible", async () => {
    cancelCrawlMock.mockResolvedValue(false);

    const response = await DELETE(
      new Request("http://localhost/api/crawl/job-404", { method: "DELETE" }),
      { params: Promise.resolve({ id: "job-404" }) } as never,
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: apiErrorMessages.jobNotCancellable,
    });
  });
});
