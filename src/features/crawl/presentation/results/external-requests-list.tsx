"use client";
"use no memo";

import { useRef, useMemo, useState } from "react";
import { Unplug } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDebouncedValue } from "@/shared/hooks/use-debounce";
import { useCrawlMessagesContext } from "@/features/crawl/presentation/crawl-messages-context";
import { EmptyState } from "@/features/crawl/presentation/results/empty-state";
import { SearchInput } from "@/features/crawl/presentation/results/search-input";

interface ExternalRequestsListProps {
  requests: string[];
}

const ROW_HEIGHT = 36;

export function ExternalRequestsList({
  requests,
}: ExternalRequestsListProps): React.JSX.Element {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const crawlMessages = useCrawlMessagesContext();
  const messages = crawlMessages.externalRequests;
  const filteredRequests = useMemo(() => {
    if (!debouncedSearch) {
      return requests;
    }

    const lowerSearch = debouncedSearch.toLowerCase();
    return requests.filter((request) => request.toLowerCase().includes(lowerSearch));
  }, [requests, debouncedSearch]);

  const virtualizer = useVirtualizer({
    count: filteredRequests.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={Unplug}
        title={messages.emptyTitle}
        description={messages.emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-3">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={messages.searchPlaceholder}
        aria-label={messages.searchAriaLabel}
      />

      <p className="text-sm text-muted-foreground">
        {messages.requestsCount(filteredRequests.length, requests.length)}
      </p>

      {filteredRequests.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          {messages.noMatchingRequests}
        </p>
      ) : (
        <div
          ref={scrollContainerRef}
          className="max-h-96 overflow-y-auto rounded-md border"
        >
          <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const request = filteredRequests[virtualRow.index];
              return (
                <div
                  key={virtualRow.index}
                  className="flex items-center overflow-hidden border-b px-3 font-mono text-xs transition-colors duration-150 hover:bg-muted/30"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <span className="truncate">{request}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
