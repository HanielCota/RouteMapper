"use client";
"use no memo";

import { useRef, useMemo, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDebouncedValue } from "@/shared/hooks/use-debounce";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCrawlMessagesContext } from "@/features/crawl/presentation/crawl-messages-context";
import { SearchInput } from "@/features/crawl/presentation/results/search-input";
import type { PageRoute } from "@/features/crawl/domain/crawl-config";

interface PageRoutesTableProps {
  routes: PageRoute[];
}

type SortKey = "url" | "path" | "pattern" | "query";
type SortDirection = "asc" | "desc";

const ROW_HEIGHT = 40;

const GRID_COLS = "grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.7fr)]";

export function PageRoutesTable({
  routes,
}: PageRoutesTableProps): React.JSX.Element {
  const crawlMessages = useCrawlMessagesContext();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [patternFilter, setPatternFilter] = useState<string | undefined>(undefined);
  const [sortKey, setSortKey] = useState<SortKey>("url");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const uniquePatterns = useMemo(
    () => [...new Set(routes.map((route) => route.pattern))].sort(),
    [routes],
  );

  const filteredRoutes = useMemo(() => {
    const filteredBySearch = debouncedSearch
      ? routes.filter((route) => {
          const lowerSearch = debouncedSearch.toLowerCase();
          return (
            route.url.toLowerCase().includes(lowerSearch) ||
            route.path.toLowerCase().includes(lowerSearch) ||
            route.pattern.toLowerCase().includes(lowerSearch)
          );
        })
      : routes;
    const filteredByPattern =
      !patternFilter
        ? filteredBySearch
        : filteredBySearch.filter((route) => route.pattern === patternFilter);

    return [...filteredByPattern].sort((left, right) => {
      const comparison = left[sortKey].localeCompare(right[sortKey]);
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [patternFilter, routes, debouncedSearch, sortDirection, sortKey]);

  const messages = crawlMessages.pageRoutesTable;

  const columns: ReadonlyArray<{
    key: SortKey;
    label: string;
  }> = [
    { key: "url", label: messages.colUrl },
    { key: "path", label: messages.colPath },
    { key: "pattern", label: messages.colPattern },
    { key: "query", label: messages.colQuery },
  ];

  const virtualizer = useVirtualizer({
    count: filteredRoutes.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const toggleSort = (key: SortKey): void => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection("asc");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={messages.searchPlaceholder}
          aria-label={messages.searchAriaLabel}
        />
        <Select
          value={patternFilter ?? ""}
          onValueChange={(value) => setPatternFilter(value || undefined)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={messages.allPatterns} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{messages.allPatterns}</SelectItem>
            {uniquePatterns.map((pattern) => (
              <SelectItem key={pattern} value={pattern}>
                <span className="font-mono text-xs">{pattern}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        {messages.routesFound(filteredRoutes.length)}
      </p>

      <div className="overflow-hidden rounded-md border" role="grid" aria-label={messages.caption}>
        <div className={cn(GRID_COLS, "bg-muted/50")}>
          {columns.map(({ key, label }) => (
            <div
              key={key}
              role="columnheader"
              tabIndex={0}
              aria-sort={
                sortKey === key
                  ? sortDirection === "asc"
                    ? "ascending"
                    : "descending"
                  : "none"
              }
              onClick={() => toggleSort(key)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") {
                  return;
                }

                event.preventDefault();
                toggleSort(key);
              }}
              className="cursor-pointer select-none whitespace-nowrap px-3 py-2.5 text-left text-sm font-medium transition-colors duration-150 hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <span className="flex items-center gap-1">
                {label}
                {sortKey === key ? (
                  <span className="text-muted-foreground" aria-hidden>
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                ) : null}
              </span>
            </div>
          ))}
        </div>

        <div
          ref={scrollContainerRef}
          className="max-h-[480px] overflow-y-auto"
        >
          {filteredRoutes.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              {messages.noRoutesFound}
            </p>
          ) : (
            <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const route = filteredRoutes[virtualRow.index];
                return (
                  <div
                    key={route.url}
                    role="row"
                    className={cn(
                      GRID_COLS,
                      "items-center border-b transition-colors duration-150 hover:bg-muted/30",
                    )}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: virtualRow.size,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div role="gridcell" className="truncate px-3 font-mono text-xs">
                      <a
                        href={route.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded text-primary transition-colors duration-150 hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        {route.url}
                      </a>
                    </div>
                    <div role="gridcell" className="truncate px-3 font-mono text-xs">
                      {route.path}
                    </div>
                    <div role="gridcell" className="truncate px-3 font-mono text-xs">
                      {route.pattern}
                    </div>
                    <div role="gridcell" className="truncate px-3 font-mono text-xs text-muted-foreground">
                      {route.query || "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
