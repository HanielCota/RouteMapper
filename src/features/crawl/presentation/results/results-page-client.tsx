"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CRAWL_STATUS } from "@/features/crawl/domain/crawl-config";
import { useCrawlMessagesContext } from "@/features/crawl/presentation/crawl-messages-context";
import { CrawlProgress } from "@/features/crawl/presentation/results/crawl-progress";
import { ResultsDashboard } from "@/features/crawl/presentation/results/results-dashboard";
import { useCancelCrawl, useCrawlStream } from "@/features/crawl/presentation/results/use-crawl-stream";
import { useCrawlResult } from "@/features/crawl/presentation/results/use-crawl-result";

const centeredPageClassName =
  "flex flex-1 flex-col items-center justify-center px-4 py-12";

interface ResultsPageClientProps {
  jobId: string;
}

export function ResultsPageClient({
  jobId,
}: ResultsPageClientProps): React.JSX.Element {
  const {
    data: jobData,
    error: jobError,
    isLoading: jobLoading,
    statusCode: jobStatusCode,
    refetch,
  } = useCrawlResult(jobId);
  const stream = useCrawlStream(jobId, { disabled: jobStatusCode === 404 });
  const cancelCrawl = useCancelCrawl();
  const crawlMessages = useCrawlMessagesContext();
  const messages = crawlMessages.resultsPage;
  const previousStreamStatusRef = useRef<typeof stream.status>(null);
  const fallbackProgress =
    stream.progress ??
    (jobData &&
    (jobData.status === CRAWL_STATUS.QUEUED ||
      jobData.status === CRAWL_STATUS.RUNNING)
      ? jobData.progress
      : null);

  useEffect(() => {
    if (!stream.status || previousStreamStatusRef.current === stream.status) {
      return;
    }

    previousStreamStatusRef.current = stream.status;

    if (stream.status === CRAWL_STATUS.COMPLETED) {
      toast.success(messages.toastCompleted);
    } else if (stream.status === CRAWL_STATUS.FAILED) {
      toast.error(stream.error || messages.toastFailed);
    } else if (stream.status === CRAWL_STATUS.CANCELLED) {
      toast.info(messages.toastCancelled);
    }

    refetch();
  }, [messages.toastCancelled, messages.toastCompleted, messages.toastFailed, refetch, stream.error, stream.status]);

  // 1. Job completed with result → show dashboard
  if (jobData?.result && jobData.status === CRAWL_STATUS.COMPLETED) {
    return (
      <main className="flex flex-1 flex-col items-center px-4 py-8">
        <ResultsDashboard result={jobData.result} />
      </main>
    );
  }

  // 2. Job failed
  const failed = jobData?.status === CRAWL_STATUS.FAILED || stream.status === CRAWL_STATUS.FAILED;
  if (failed) {
    return (
      <main className={centeredPageClassName}>
        <div className="space-y-4 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" aria-hidden />
          <h2 className="text-xl font-bold">{messages.scanFailed}</h2>
          <p className="max-w-md leading-relaxed text-muted-foreground">
            {jobData?.error || stream.error || messages.unknownError}
          </p>
          <Link href="/">
            <Button>{messages.tryAgain}</Button>
          </Link>
        </div>
      </main>
    );
  }

  // 3. Job cancelled
  const cancelled =
    jobData?.status === CRAWL_STATUS.CANCELLED ||
    stream.status === CRAWL_STATUS.CANCELLED;
  if (cancelled) {
    return (
      <main className={centeredPageClassName}>
        <div className="space-y-4 text-center">
          <h2 className="text-xl font-bold">{messages.scanCancelled}</h2>
          <p className="text-muted-foreground">{messages.scanCancelledDesc}</p>
          <Link href="/">
            <Button>{messages.startNewScan}</Button>
          </Link>
        </div>
      </main>
    );
  }

  // 4. Stream active or queued/running snapshot
  if (
    stream.isConnected ||
    fallbackProgress !== null ||
    jobData?.status === CRAWL_STATUS.QUEUED ||
    jobData?.status === CRAWL_STATUS.RUNNING
  ) {
    return (
      <main className="flex flex-1 flex-col items-center px-4 py-8">
        <CrawlProgress
          progress={fallbackProgress}
          logs={stream.logs}
          onCancel={() => {
            cancelCrawl(jobId).catch(() => toast.error(messages.cancelFailed));
          }}
        />
      </main>
    );
  }

  // 5. Job not found
  if (jobStatusCode === 404) {
    return (
      <main className={centeredPageClassName}>
        <div className="space-y-4 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" aria-hidden />
          <h2 className="text-xl font-bold">{messages.unavailable}</h2>
          <p className="max-w-md leading-relaxed text-muted-foreground">
            {messages.unavailableDesc}
          </p>
          <Link href="/">
            <Button>{messages.startNewScan}</Button>
          </Link>
        </div>
      </main>
    );
  }

  // 6. Non-404 fetch failure
  if (jobError && !jobLoading) {
    return (
      <main className={centeredPageClassName}>
        <div className="space-y-4 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" aria-hidden />
          <h2 className="text-xl font-bold">{messages.unknownError}</h2>
          <p className="max-w-md leading-relaxed text-muted-foreground">
            {jobError}
          </p>
          <Link href="/">
            <Button>{messages.startNewScan}</Button>
          </Link>
        </div>
      </main>
    );
  }

  // 7. Loading / connecting
  return (
    <main className={centeredPageClassName}>
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
      <p className="mt-4 text-muted-foreground">{messages.connecting}</p>
    </main>
  );
}
