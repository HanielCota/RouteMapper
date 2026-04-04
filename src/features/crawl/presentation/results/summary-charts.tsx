"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { classifyAssetUrl, type AssetType } from "@/features/crawl/presentation/results/asset-type";
import { useCrawlMessagesContext } from "@/features/crawl/presentation/crawl-messages-context";
import type { CrawlResult } from "@/features/crawl/domain/crawl-config";

interface SummaryChartsProps {
  result: CrawlResult;
}

const ASSET_COLORS: Record<AssetType, string> = {
  js: "oklch(0.75 0.15 85)",
  css: "oklch(0.55 0.2 255)",
  image: "oklch(0.55 0.17 150)",
  font: "oklch(0.65 0.15 330)",
  other: "oklch(0.55 0 0)",
};

const ASSET_LABEL_KEYS: Record<AssetType, "typeJs" | "typeCss" | "typeImage" | "typeFont" | "typeOther"> = {
  js: "typeJs",
  css: "typeCss",
  image: "typeImage",
  font: "typeFont",
  other: "typeOther",
};

const METHOD_COLORS: Record<string, string> = {
  GET: "oklch(0.55 0.17 150)",
  POST: "oklch(0.55 0.2 255)",
  PUT: "oklch(0.75 0.15 85)",
  PATCH: "oklch(0.65 0.15 330)",
  DELETE: "oklch(0.65 0.2 25)",
  OPTIONS: "oklch(0.55 0 0)",
  HEAD: "oklch(0.5 0.1 200)",
};

const DISCOVERY_COLORS = [
  "oklch(0.55 0.2 255)",
  "oklch(0.55 0.17 150)",
  "oklch(0.75 0.15 85)",
  "oklch(0.65 0.15 330)",
  "oklch(0.65 0.2 25)",
];

const tooltipStyle = {
  contentStyle: {
    background: "oklch(0.18 0.005 255)",
    border: "1px solid oklch(1 0 0 / 10%)",
    borderRadius: "10px",
    fontSize: "12px",
    color: "oklch(0.92 0 0)",
    boxShadow: "0 8px 24px oklch(0 0 0 / 30%)",
    padding: "8px 12px",
  },
  itemStyle: { color: "oklch(0.92 0 0)" },
};

function ChartLegend({
  items,
}: {
  items: { name: string; value: number; color: string }[];
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-2.5 text-xs">
          <span
            className="inline-block h-3 w-3 shrink-0 rounded"
            style={{ background: item.color }}
          />
          <span className="flex-1 text-muted-foreground">{item.name}</span>
          <span className="font-semibold tabular-nums">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export function SummaryCharts({
  result,
}: SummaryChartsProps): React.JSX.Element {
  const crawlMessages = useCrawlMessagesContext();
  const messages = crawlMessages.charts;

  const assetLabels = crawlMessages.assetsList;

  const assetData = useMemo(() => {
    const counts = new Map<AssetType, number>();
    for (const url of result.assetRequests) {
      const type = classifyAssetUrl(url);
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([key, value]) => ({
        name: assetLabels[ASSET_LABEL_KEYS[key]],
        key,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [assetLabels, result.assetRequests]);

  const methodData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const route of result.apiRoutes) {
      for (const method of route.methods) {
        counts.set(method, (counts.get(method) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [result.apiRoutes]);

  const discoveryData = useMemo(() => {
    return [
      { name: messages.pages, value: result.pageRoutes.length },
      { name: messages.apis, value: result.apiRoutes.length },
      { name: messages.assets, value: result.assetRequests.length },
      { name: messages.external, value: result.externalRequests.length },
      { name: messages.errors, value: result.errors.length },
    ].filter((item) => item.value > 0);
  }, [result, messages]);

  const topPatterns = useMemo(() => {
    const counts = new Map<string, number>();
    for (const route of result.pageRoutes) {
      counts.set(route.pattern, (counts.get(route.pattern) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [result.pageRoutes]);

  const hasAssets = assetData.length > 0;
  const hasMethods = methodData.length > 0;
  const hasPatterns = topPatterns.length > 0;

  if (!hasAssets && !hasMethods && !hasPatterns) {
    return <></>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          {messages.sectionTitle}
        </span>
        <Separator className="flex-1" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm">{messages.discoveryOverview}</CardTitle>
            <CardDescription>{messages.discoveryDesc}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center gap-6">
              <div className="w-[180px] shrink-0">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={discoveryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                      animationDuration={600}
                    >
                      {discoveryData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={DISCOVERY_COLORS[index % DISCOVERY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ChartLegend
                items={discoveryData.map((item, i) => ({
                  ...item,
                  color: DISCOVERY_COLORS[i % DISCOVERY_COLORS.length],
                }))}
              />
            </div>
          </CardContent>
        </Card>

        {hasAssets ? (
          <Card className="shadow-sm">
            <CardHeader className="pb-0">
              <CardTitle className="text-sm">{messages.assetsByType}</CardTitle>
              <CardDescription>{messages.assetsDesc}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center gap-6">
                <div className="w-[180px] shrink-0">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={assetData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                        animationDuration={600}
                      >
                        {assetData.map((entry) => (
                          <Cell key={entry.key} fill={ASSET_COLORS[entry.key]} />
                        ))}
                      </Pie>
                      <Tooltip {...tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ChartLegend
                  items={assetData.map((item) => ({
                    ...item,
                    color: ASSET_COLORS[item.key],
                  }))}
                />
              </div>
            </CardContent>
          </Card>
        ) : null}

        {hasMethods ? (
          <Card className="shadow-sm">
            <CardHeader className="pb-0">
              <CardTitle className="text-sm">{messages.httpMethods}</CardTitle>
              <CardDescription>{messages.httpMethodsDesc}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={methodData}
                  layout="vertical"
                  margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={55}
                    tick={{
                      fontSize: 12,
                      fontFamily: "var(--font-mono, monospace)",
                      fontWeight: 600,
                      fill: "oklch(0.65 0 0)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip {...tooltipStyle} cursor={false} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={22} animationDuration={600}>
                    {methodData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={METHOD_COLORS[entry.name] ?? "oklch(0.55 0 0)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}

        {hasPatterns ? (
          <Card className="shadow-sm">
            <CardHeader className="pb-0">
              <CardTitle className="text-sm">{messages.topPatterns}</CardTitle>
              <CardDescription>{messages.topPatternsDesc}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={topPatterns}
                  layout="vertical"
                  margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{
                      fontSize: 11,
                      fontFamily: "var(--font-mono, monospace)",
                      fill: "oklch(0.65 0 0)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip {...tooltipStyle} cursor={false} />
                  <Bar
                    dataKey="value"
                    radius={[0, 8, 8, 0]}
                    barSize={18}
                    fill="oklch(0.55 0.2 255 / 60%)"
                    animationDuration={600}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
