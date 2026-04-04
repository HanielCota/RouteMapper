"use client";
"use no memo";

import { useRef, useMemo, useState } from "react";
import { File, FileCode, FileText, ImageIcon, Type } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDebouncedValue } from "@/shared/hooks/use-debounce";
import { Badge } from "@/components/ui/badge";
import { assetTypeVariants } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import { classifyAssetUrl, type AssetType } from "@/features/crawl/presentation/results/asset-type";
import { useCrawlMessagesContext } from "@/features/crawl/presentation/crawl-messages-context";
import { EmptyState } from "@/features/crawl/presentation/results/empty-state";
import { SearchInput } from "@/features/crawl/presentation/results/search-input";

interface AssetsListProps {
  assets: string[];
}

const ROW_HEIGHT = 40;

export function AssetsList({ assets }: AssetsListProps): React.JSX.Element {
  const crawlMessages = useCrawlMessagesContext();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [typeFilter, setTypeFilter] = useState<AssetType | "all">("all");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messages = crawlMessages.assetsList;

  const typeMeta: Record<AssetType, { label: string; icon: typeof FileCode }> = {
    js: { label: messages.typeJs, icon: FileCode },
    css: { label: messages.typeCss, icon: Type },
    image: { label: messages.typeImage, icon: ImageIcon },
    font: { label: messages.typeFont, icon: FileText },
    other: { label: messages.typeOther, icon: File },
  };

  const classifiedAssets = useMemo(
    () => assets.map((assetUrl) => ({ url: assetUrl, type: classifyAssetUrl(assetUrl) })),
    [assets],
  );
  const typeCounts = useMemo(() => {
    const counts: Partial<Record<AssetType, number>> = {};
    for (const asset of classifiedAssets) {
      counts[asset.type] = (counts[asset.type] || 0) + 1;
    }

    return counts;
  }, [classifiedAssets]);
  const filteredAssets = useMemo(() => {
    const filteredByType =
      typeFilter === "all"
        ? classifiedAssets
        : classifiedAssets.filter((asset) => asset.type === typeFilter);

    if (!debouncedSearch) {
      return filteredByType;
    }

    const lowerSearch = debouncedSearch.toLowerCase();
    return filteredByType.filter((asset) => asset.url.toLowerCase().includes(lowerSearch));
  }, [classifiedAssets, debouncedSearch, typeFilter]);

  const virtualizer = useVirtualizer({
    count: filteredAssets.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  if (assets.length === 0) {
    return (
      <EmptyState
        icon={File}
        title={messages.emptyTitle}
        description={messages.emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={messages.searchPlaceholder}
          aria-label={messages.searchAriaLabel}
        />
        <div className="flex flex-wrap gap-1" role="group" aria-label={messages.filterByType}>
          <FilterButton
            active={typeFilter === "all"}
            onClick={() => setTypeFilter("all")}
            label={messages.all(assets.length)}
          />
          {(Object.keys(typeMeta) as AssetType[]).map((type) => {
            if (!typeCounts[type]) {
              return null;
            }

            return (
              <FilterButton
                key={type}
                active={typeFilter === type}
                activeClassName={assetTypeVariants[type]}
                onClick={() =>
                  setTypeFilter((currentFilter) => (currentFilter === type ? "all" : type))
                }
                label={`${typeMeta[type].label} (${typeCounts[type]})`}
              />
            );
          })}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {messages.assetsCount(filteredAssets.length, assets.length)}
      </p>

      {filteredAssets.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          {messages.noMatchingAssets}
        </p>
      ) : (
        <div
          ref={scrollContainerRef}
          className="max-h-96 overflow-y-auto rounded-md border"
        >
          <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const asset = filteredAssets[virtualRow.index];
              return (
                <div
                  key={asset.url}
                  className="flex items-center gap-2 border-b px-3 py-2.5 transition-colors duration-150 hover:bg-muted/30"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <Badge
                    variant="outline"
                    className={cn("shrink-0 text-xs", assetTypeVariants[asset.type])}
                  >
                    {typeMeta[asset.type].label}
                  </Badge>
                  <span className="min-w-0 truncate font-mono text-xs">
                    {asset.url}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterButton({
  active,
  activeClassName,
  onClick,
  label,
}: {
  active: boolean;
  activeClassName?: string;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-6 cursor-pointer items-center rounded-full border px-2.5 text-xs font-medium transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        active
          ? activeClassName ?? "border-primary/25 bg-primary text-primary-foreground"
          : "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
