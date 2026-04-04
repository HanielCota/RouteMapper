"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  ImageIcon,
  Layers,
  Server,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCrawlMessagesContext } from "@/features/crawl/presentation/crawl-messages-context";
import { useLocale } from "@/shared/i18n/locale-context";
import { cn } from "@/lib/utils";
import type { CrawlSummary } from "@/features/crawl/domain/crawl-config";

interface CrawlSummaryCardProps {
  summary: CrawlSummary;
}

export function CrawlSummaryCard({
  summary,
}: CrawlSummaryCardProps): React.JSX.Element {
  const crawlMessages = useCrawlMessagesContext();
  const { locale } = useLocale();
  const messages = crawlMessages.summary;

  const metricDefinitions: ReadonlyArray<{
    key: keyof Pick<
      CrawlSummary,
      | "pagesVisited"
      | "pagesDiscovered"
      | "apiRoutesDiscovered"
      | "assetsObserved"
      | "externalRequestsObserved"
      | "errors"
    >;
    label: string;
    tooltip: string;
    icon: typeof FileText;
    color: string;
    isError?: boolean;
  }> = [
    {
      key: "pagesVisited",
      label: messages.pagesVisited,
      tooltip: messages.pagesVisitedTooltip,
      icon: FileText,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      key: "pagesDiscovered",
      label: messages.pagesDiscovered,
      tooltip: messages.pagesDiscoveredTooltip,
      icon: Layers,
      color: "text-violet-500 bg-violet-500/10",
    },
    {
      key: "apiRoutesDiscovered",
      label: messages.apiRoutes,
      tooltip: messages.apiRoutesTooltip,
      icon: Server,
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      key: "assetsObserved",
      label: messages.assets,
      tooltip: messages.assetsTooltip,
      icon: ImageIcon,
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      key: "externalRequestsObserved",
      label: messages.externalRequests,
      tooltip: messages.externalRequestsTooltip,
      icon: ExternalLink,
      color: "text-pink-500 bg-pink-500/10",
    },
    {
      key: "errors",
      label: messages.errors,
      tooltip: messages.errorsTooltip,
      icon: AlertTriangle,
      color: "text-red-500 bg-red-500/10",
      isError: true,
    },
  ];
  const totalDiscovered =
    summary.pagesDiscovered +
    summary.apiRoutesDiscovered +
    summary.assetsObserved +
    summary.externalRequestsObserved;
  const crawlProgress = Math.round(
    (summary.pagesVisited / Math.max(summary.pagesDiscovered, 1)) * 100,
  );
  const hasErrors = summary.errors > 0;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card className="overflow-hidden shadow-sm">
          <div>
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                    <Globe className="h-6 w-6 text-primary" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {messages.scannedUrl}
                    </p>
                    <p
                      className="truncate font-mono text-sm font-medium"
                      title={summary.startUrl}
                    >
                      {summary.startUrl}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Badge variant={hasErrors ? "warning" : "success"} className="gap-1">
                        {hasErrors ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
                        {hasErrors
                          ? messages.completedWithErrors(summary.errors)
                          : messages.completedSuccess}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {messages.totalDiscovered(totalDiscovered)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 text-muted-foreground sm:flex-col sm:items-end">
                  <Clock className="h-4 w-4 shrink-0" aria-hidden />
                  <time className="text-xs tabular-nums" dateTime={summary.scannedAt}>
                    {new Date(summary.scannedAt).toLocaleString(locale)}
                  </time>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{messages.coverageLabel}</span>
                  <span className="font-medium tabular-nums">{crawlProgress}%</span>
                </div>
                <Progress value={crawlProgress} className="[&_[data-slot=progress-track]]:h-2">
                </Progress>
                <p className="text-xs text-muted-foreground">
                  {messages.coverageDesc(summary.pagesVisited, summary.pagesDiscovered)}
                </p>
              </div>
            </CardContent>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {metricDefinitions.map(({ key, label, tooltip, icon: Icon, color, isError }) => {
            const value = summary[key];
            const highlighted = Boolean(isError && value > 0);

            return (
              <Tooltip key={key}>
                <TooltipTrigger>
                  <Card
                    className={cn(
                      "group shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                      highlighted && "ring-1 ring-destructive/30",
                    )}
                  >
                    <CardContent className="flex flex-col items-center gap-3 p-4">
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110",
                          color,
                        )}
                      >
                        <Icon className="h-4.5 w-4.5" aria-hidden />
                      </div>
                      <div className="text-center">
                        <p
                          className={cn(
                            "text-2xl font-bold tabular-nums leading-none",
                            highlighted && "text-destructive",
                          )}
                        >
                          {value}
                        </p>
                        <p className="mt-1.5 text-[11px] font-medium leading-tight text-muted-foreground">
                          {label}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
