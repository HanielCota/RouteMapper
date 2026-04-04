"use client";
"use no memo";

import { useRef, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDebouncedValue } from "@/shared/hooks/use-debounce";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { methodColorVariants } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import { useCrawlMessagesContext } from "@/features/crawl/presentation/crawl-messages-context";
import { SearchInput } from "@/features/crawl/presentation/results/search-input";
import type { ApiRoute } from "@/features/crawl/domain/crawl-config";

interface ApiRoutesTableProps {
  routes: ApiRoute[];
}

const ROW_HEIGHT = 44;
const EXPANDED_URL_HEIGHT = 24;
const EXPANDED_PADDING = 40;

const GRID_COLS = "grid grid-cols-[2.5rem_minmax(0,1.4fr)_minmax(0,1.6fr)_minmax(0,1fr)]";

export function ApiRoutesTable({
  routes,
}: ApiRoutesTableProps): React.JSX.Element {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [methodFilter, setMethodFilter] = useState<string | undefined>(undefined);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const allMethods = useMemo(
    () => [...new Set(routes.flatMap((route) => route.methods))].sort(),
    [routes],
  );
  const filteredRoutes = useMemo(() => {
    const filteredBySearch = debouncedSearch
      ? routes.filter((route) => {
          const lowerSearch = debouncedSearch.toLowerCase();
          return (
            route.path.toLowerCase().includes(lowerSearch) ||
            route.pattern.toLowerCase().includes(lowerSearch)
          );
        })
      : routes;

    if (!methodFilter) {
      return filteredBySearch;
    }

    return filteredBySearch.filter((route) => route.methods.includes(methodFilter));
  }, [methodFilter, routes, debouncedSearch]);

  const crawlMessages = useCrawlMessagesContext();
  const messages = crawlMessages.apiRoutesTable;

  const virtualizer = useVirtualizer({
    count: filteredRoutes.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) => {
      const route = filteredRoutes[index];
      if (!expandedPaths.has(route.path)) {
        return ROW_HEIGHT;
      }

      return ROW_HEIGHT + EXPANDED_PADDING + route.observedUrls.length * EXPANDED_URL_HEIGHT;
    },
    overscan: 5,
  });

  const toggleRow = (path: string): void => {
    setExpandedPaths((currentPaths) => {
      const nextPaths = new Set(currentPaths);
      if (nextPaths.has(path)) {
        nextPaths.delete(path);
      } else {
        nextPaths.add(path);
      }

      return nextPaths;
    });

    virtualizer.measure();
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
          value={methodFilter ?? ""}
          onValueChange={(value) => setMethodFilter(value || undefined)}
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder={messages.allMethods} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{messages.allMethods}</SelectItem>
            {allMethods.map((method) => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        {messages.routesFound(filteredRoutes.length)}
      </p>

      <div className="overflow-hidden rounded-md border" role="grid" aria-label={messages.caption}>
        <div className={cn(GRID_COLS, "bg-muted/50 text-sm font-medium")}>
          <div role="columnheader" className="px-2 py-2.5">
            <span className="sr-only">{messages.expand}</span>
          </div>
          <div role="columnheader" className="px-3 py-2.5 text-left">
            {messages.colPath}
          </div>
          <div role="columnheader" className="px-3 py-2.5 text-left">
            {messages.colPattern}
          </div>
          <div role="columnheader" className="px-3 py-2.5 text-left">
            {messages.colMethods}
          </div>
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
                const expanded = expandedPaths.has(route.path);

                return (
                  <div
                    key={route.path}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div
                      role="row"
                      className={cn(
                        GRID_COLS,
                        "cursor-pointer items-center border-b text-sm transition-colors duration-150 hover:bg-muted/30",
                      )}
                      style={{ height: ROW_HEIGHT }}
                      onClick={() => toggleRow(route.path)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" && event.key !== " ") {
                          return;
                        }

                        event.preventDefault();
                        toggleRow(route.path);
                      }}
                      tabIndex={0}
                      aria-expanded={expanded}
                    >
                      <div role="gridcell" className="flex items-center justify-center px-2">
                        <button
                          type="button"
                          className="inline-flex cursor-pointer items-center justify-center rounded text-muted-foreground transition-all duration-150 hover:text-foreground hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleRow(route.path);
                          }}
                          aria-label={expanded ? messages.collapse : messages.expand}
                        >
                          {expanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <div role="gridcell" className="truncate px-3 font-mono text-xs">
                        {route.path}
                      </div>
                      <div role="gridcell" className="truncate px-3 font-mono text-xs text-muted-foreground">
                        {route.pattern}
                      </div>
                      <div role="gridcell" className="px-3">
                        <div className="flex flex-wrap gap-1">
                          {route.methods.map((method) => (
                            <Badge
                              key={method}
                              variant="outline"
                              className={cn(
                                "text-xs",
                                methodColorVariants[
                                  method as keyof typeof methodColorVariants
                                ] || methodColorVariants.default,
                              )}
                            >
                              {method}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    {expanded ? (
                      <div className="border-b bg-muted/20 px-10 py-3">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                          {messages.observedUrls(route.observedUrls.length)}
                        </p>
                        <ul className="space-y-1">
                          {route.observedUrls.map((url) => (
                            <li
                              key={url}
                              className="break-all font-mono text-xs text-muted-foreground"
                            >
                              {url}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
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
