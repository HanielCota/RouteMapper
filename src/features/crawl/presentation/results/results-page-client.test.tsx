import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResultsPageClient } from "@/features/crawl/presentation/results/results-page-client";

const hooks = vi.hoisted(() => ({
  crawlResult: {
    data: null,
    isLoading: false,
    error: null,
    statusCode: null,
    refetch: vi.fn(),
  },
  crawlStream: {
    progress: null,
    logs: [],
    status: null,
    error: null,
    isConnected: false,
  },
  cancelCrawl: vi.fn(async () => undefined),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/features/crawl/presentation/results/use-crawl-result", () => ({
  useCrawlResult: () => hooks.crawlResult,
}));

vi.mock("@/features/crawl/presentation/results/use-crawl-stream", () => ({
  useCrawlStream: () => hooks.crawlStream,
  useCancelCrawl: () => hooks.cancelCrawl,
}));

describe("ResultsPageClient", () => {
  afterEach(() => {
    hooks.crawlResult = {
      data: null,
      isLoading: false,
      error: null,
      statusCode: null,
      refetch: vi.fn(),
    };
    hooks.crawlStream = {
      progress: null,
      logs: [],
      status: null,
      error: null,
      isConnected: false,
    };
  });

  it("renders an unavailable state for missing jobs instead of an endless connecting state", () => {
    hooks.crawlResult = {
      data: null,
      isLoading: false,
      error: "Job not found",
      statusCode: 404,
      refetch: vi.fn(),
    };

    const markup = renderToStaticMarkup(<ResultsPageClient jobId="job-404" />);

    expect(markup).toContain("Resultado indisponível");
    expect(markup).toContain("Este job não existe mais");
    expect(markup).not.toContain("Conectando...");
  });

  it("renders the progress view from the fetched snapshot while the stream is still connecting", () => {
    hooks.crawlResult = {
      data: {
        id: "job-running",
        status: "running",
        progress: {
          pagesVisited: 2,
          maxPages: 5,
          currentUrl: "https://example.com/dashboard",
          pagesInQueue: 3,
        },
        result: null,
        error: null,
        createdAt: "2026-04-03T00:00:00.000Z",
        updatedAt: "2026-04-03T00:00:00.000Z",
      },
      isLoading: false,
      error: null,
      statusCode: null,
      refetch: vi.fn(),
    };

    const markup = renderToStaticMarkup(<ResultsPageClient jobId="job-running" />);

    expect(markup).toContain("Varrendo");
    expect(markup).toContain("Página 2 de 5");
    expect(markup).not.toContain("Conectando...");
  });
});
