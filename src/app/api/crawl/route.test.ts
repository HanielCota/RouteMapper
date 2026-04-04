import { afterEach, describe, expect, it, vi } from "vitest";

const { startCrawlMock, runCrawlMock } = vi.hoisted(() => ({
  startCrawlMock: vi.fn(),
  runCrawlMock: vi.fn(),
}));

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return {
    ...actual,
    after: (callback: () => void | Promise<void>) => {
      void callback();
    },
  };
});

vi.mock("@/features/crawl/infrastructure/server-runtime", () => ({
  getCrawlService: () => ({
    startCrawl: startCrawlMock,
    runCrawl: runCrawlMock,
  }),
}));

import { POST } from "./route";

describe("POST /api/crawl", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("creates a crawl job when the payload is valid", async () => {
    startCrawlMock.mockResolvedValue("job-123");

    const response = await POST(
      new Request("http://localhost/api/crawl", {
        method: "POST",
        body: JSON.stringify({
          url: "https://example.com",
          maxPages: 5,
          maxClicksPerPage: 1,
          timeoutMs: 10000,
          navigationIdleTimeoutMs: 1000,
          interactionIdleTimeoutMs: 500,
          allowedHostsMode: "related",
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id: "job-123" });
    expect(runCrawlMock).toHaveBeenCalledWith("job-123");
  });

  it("returns validation errors for an invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/crawl", {
        method: "POST",
        body: JSON.stringify({ url: "not-a-url" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(startCrawlMock).not.toHaveBeenCalled();
  });
});
