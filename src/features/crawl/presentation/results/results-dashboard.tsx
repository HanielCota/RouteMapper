"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Copy, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCrawlMessagesContext } from "@/features/crawl/presentation/crawl-messages-context";
import type { CrawlMessages } from "@/features/crawl/presentation/crawl-messages";
import { CapturedTokensCard } from "@/features/crawl/presentation/results/captured-tokens-card";
import { CrawlSummaryCard } from "@/features/crawl/presentation/results/crawl-summary-card";
import type { CrawlResult } from "@/features/crawl/domain/crawl-config";

const TabLoader = () => (
  <div className="flex h-60 items-center justify-center">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

const SummaryCharts = dynamic(
  () => import("@/features/crawl/presentation/results/summary-charts").then((m) => m.SummaryCharts),
  { ssr: false, loading: TabLoader },
);

const SitemapGraph = dynamic(
  () => import("@/features/crawl/presentation/results/sitemap-graph").then((m) => m.SitemapGraph),
  { ssr: false, loading: TabLoader },
);

const PageRoutesTable = dynamic(
  () => import("@/features/crawl/presentation/results/page-routes-table").then((m) => m.PageRoutesTable),
  { loading: TabLoader },
);

const ApiRoutesTable = dynamic(
  () => import("@/features/crawl/presentation/results/api-routes-table").then((m) => m.ApiRoutesTable),
  { loading: TabLoader },
);

const AssetsList = dynamic(
  () => import("@/features/crawl/presentation/results/assets-list").then((m) => m.AssetsList),
  { loading: TabLoader },
);

const ExternalRequestsList = dynamic(
  () => import("@/features/crawl/presentation/results/external-requests-list").then((m) => m.ExternalRequestsList),
  { loading: TabLoader },
);

const ErrorLog = dynamic(
  () => import("@/features/crawl/presentation/results/error-log").then((m) => m.ErrorLog),
  { loading: TabLoader },
);

interface ResultsDashboardProps {
  result: CrawlResult;
}

const tabContentClassName = "mt-6 animate-in fade-in-0 duration-200";
const tabTriggerClassName = "px-3 py-1.5 data-[state=active]:bg-background";

function downloadJson(result: CrawlResult, messages: CrawlMessages["dashboard"]): void {
  const blob = new Blob([JSON.stringify(result, null, 2)], {
    type: "application/json",
  });
  const blobUrl = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
  const anchor = document.createElement("a");

  anchor.href = blobUrl;
  anchor.download = `crawl-${timestamp}.json`;
  anchor.click();
  URL.revokeObjectURL(blobUrl);

  toast.success(messages.toastJsonDownloaded);
}

async function copySummaryToClipboard(result: CrawlResult, messages: CrawlMessages["dashboard"]): Promise<void> {
  const summaryText = messages.copySummaryText(result.summary);
  await navigator.clipboard.writeText(summaryText);
  toast.success(messages.toastSummaryCopied);
}

export function ResultsDashboard({
  result,
}: ResultsDashboardProps): React.JSX.Element {
  const crawlMessages = useCrawlMessagesContext();
  const messages = crawlMessages.dashboard;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            {messages.newScan}
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void copySummaryToClipboard(result, messages)}
            className="gap-1.5"
          >
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline">{messages.copySummaryFull}</span>
            <span className="sm:hidden">{messages.copySummaryShort}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadJson(result, messages)}
            className="gap-1.5"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{messages.downloadJsonFull}</span>
            <span className="sm:hidden">{messages.downloadJsonShort}</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" style={{ scrollbarWidth: "none" }}>
          <TabsList className="inline-flex h-auto w-max gap-1 bg-muted/50 p-1 sm:w-full sm:justify-start">
            <TabsTrigger value="summary" className={tabTriggerClassName}>
              {messages.tabSummary}
            </TabsTrigger>
            <TabsTrigger value="sitemap" className={tabTriggerClassName}>
              {messages.tabSitemap}
            </TabsTrigger>
            <TabsTrigger value="pages" className={tabTriggerClassName}>
              {messages.tabPages} ({result.pageRoutes.length})
            </TabsTrigger>
            <TabsTrigger value="apis" className={tabTriggerClassName}>
              {messages.tabApis} ({result.apiRoutes.length})
            </TabsTrigger>
            <TabsTrigger value="assets" className={tabTriggerClassName}>
              {messages.tabAssets} ({result.assetRequests.length})
            </TabsTrigger>
            <TabsTrigger value="external" className={tabTriggerClassName}>
              {messages.tabExternal} ({result.externalRequests.length})
            </TabsTrigger>
            <TabsTrigger value="errors" className={tabTriggerClassName}>
              {messages.tabErrors} ({result.errors.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="summary" className={tabContentClassName}>
          <div className="space-y-6">
            <CrawlSummaryCard summary={result.summary} />
            <CapturedTokensCard tokens={result.capturedCredentials} />
            <SummaryCharts result={result} />
          </div>
        </TabsContent>
        <TabsContent value="sitemap" className={tabContentClassName}>
          <SitemapGraph
            pageRoutes={result.pageRoutes}
            apiRoutes={result.apiRoutes}
            startUrl={result.summary.startUrl}
          />
        </TabsContent>
        <TabsContent value="pages" className={tabContentClassName}>
          <PageRoutesTable routes={result.pageRoutes} />
        </TabsContent>
        <TabsContent value="apis" className={tabContentClassName}>
          <ApiRoutesTable routes={result.apiRoutes} />
        </TabsContent>
        <TabsContent value="assets" className={tabContentClassName}>
          <AssetsList assets={result.assetRequests} />
        </TabsContent>
        <TabsContent value="external" className={tabContentClassName}>
          <ExternalRequestsList requests={result.externalRequests} />
        </TabsContent>
        <TabsContent value="errors" className={tabContentClassName}>
          <ErrorLog errors={result.errors} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
