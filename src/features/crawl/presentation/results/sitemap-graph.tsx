"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@/shared/hooks/use-debounce";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
import { useCrawlMessagesContext } from "@/features/crawl/presentation/crawl-messages-context";
import { SearchInput } from "@/features/crawl/presentation/results/search-input";
import type { PageRoute, ApiRoute } from "@/features/crawl/domain/crawl-config";

interface SitemapGraphProps {
  pageRoutes: PageRoute[];
  apiRoutes: ApiRoute[];
  startUrl: string;
}

interface TreeNode {
  segment: string;
  fullPath: string;
  children: Map<string, TreeNode>;
  isPage: boolean;
  isApi: boolean;
  methods: string[];
}

type NodeType = "page" | "api" | "both" | "directory";
type FilterMode = "all" | "pages" | "apis";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 44;
const HORIZONTAL_GAP = 60;
const VERTICAL_GAP = 16;

function buildTree(pageRoutes: PageRoute[], apiRoutes: ApiRoute[]): TreeNode {
  const root: TreeNode = {
    segment: "/",
    fullPath: "/",
    children: new Map(),
    isPage: false,
    isApi: false,
    methods: [],
  };

  for (const route of pageRoutes) {
    const segments = route.path.split("/").filter(Boolean);
    let current = root;

    if (segments.length === 0) {
      current.isPage = true;
      continue;
    }

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (!current.children.has(segment)) {
        current.children.set(segment, {
          segment,
          fullPath: "/" + segments.slice(0, i + 1).join("/"),
          children: new Map(),
          isPage: false,
          isApi: false,
          methods: [],
        });
      }

      current = current.children.get(segment)!;
    }

    current.isPage = true;
  }

  for (const route of apiRoutes) {
    const segments = route.path.split("/").filter(Boolean);
    let current = root;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (!current.children.has(segment)) {
        current.children.set(segment, {
          segment,
          fullPath: "/" + segments.slice(0, i + 1).join("/"),
          children: new Map(),
          isPage: false,
          isApi: false,
          methods: [],
        });
      }

      current = current.children.get(segment)!;
    }

    current.isApi = true;
    current.methods = route.methods;
  }

  return root;
}

function getNodeType(node: TreeNode): NodeType {
  if (node.isPage && node.isApi) return "both";
  if (node.isPage) return "page";
  if (node.isApi) return "api";
  return "directory";
}

const NODE_COLORS: Record<NodeType, { bg: string; border: string; text: string }> = {
  page: {
    bg: "oklch(0.55 0.2 255 / 12%)",
    border: "oklch(0.55 0.2 255 / 40%)",
    text: "oklch(0.55 0.2 255)",
  },
  api: {
    bg: "oklch(0.55 0.17 150 / 12%)",
    border: "oklch(0.55 0.17 150 / 40%)",
    text: "oklch(0.55 0.17 150)",
  },
  both: {
    bg: "oklch(0.75 0.15 85 / 12%)",
    border: "oklch(0.75 0.15 85 / 40%)",
    text: "oklch(0.65 0.12 85)",
  },
  directory: {
    bg: "oklch(0.5 0 0 / 8%)",
    border: "oklch(0.5 0 0 / 20%)",
    text: "oklch(0.5 0 0)",
  },
};

const HIGHLIGHT_RING = "oklch(0.65 0.2 255)";
const SEARCH_RING = "oklch(0.75 0.15 85)";

function makeNodeStyle(
  type: NodeType,
  state: "normal" | "dimmed" | "highlighted" | "search-match",
) {
  const colors = NODE_COLORS[type];
  const base = {
    padding: "8px 14px",
    borderRadius: "10px",
    fontSize: "13px",
    fontFamily: "var(--font-mono, monospace)",
    fontWeight: 500,
    border: "2px solid",
    minWidth: `${NODE_WIDTH}px`,
    maxWidth: "240px",
    textAlign: "center" as const,
    whiteSpace: "nowrap" as const,
    overflow: "hidden" as const,
    textOverflow: "ellipsis" as const,
    transition: "all 0.2s ease",
    cursor: "pointer",
  };

  switch (state) {
    case "dimmed":
      return { ...base, background: colors.bg, borderColor: colors.border, color: colors.text, opacity: 0.2 };
    case "highlighted":
      return { ...base, background: colors.bg, borderColor: HIGHLIGHT_RING, color: colors.text, boxShadow: `0 0 0 3px ${HIGHLIGHT_RING}40` };
    case "search-match":
      return { ...base, background: colors.bg, borderColor: SEARCH_RING, color: colors.text, boxShadow: `0 0 0 3px ${SEARCH_RING}40` };
    default:
      return { ...base, background: colors.bg, borderColor: colors.border, color: colors.text, opacity: 1 };
  }
}

interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

function layoutTree(root: TreeNode, hostname: string): LayoutResult {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let yOffset = 0;

  function traverse(node: TreeNode, depth: number, parentId: string | null): number {
    const nodeId = node.fullPath === "/" ? "root" : node.fullPath;
    const type = getNodeType(node);
    const label =
      node.fullPath === "/"
        ? hostname
        : node.isApi && node.methods.length > 0
          ? `${node.segment}  [${node.methods.join(", ")}]`
          : node.segment;

    const x = depth * (NODE_WIDTH + HORIZONTAL_GAP);
    const startY = yOffset;
    const childEntries = [...node.children.values()];

    if (childEntries.length === 0) {
      nodes.push({
        id: nodeId,
        position: { x, y: startY },
        data: { label, nodeType: type, fullPath: node.fullPath },
        style: makeNodeStyle(type, "normal"),
        type: "default",
      });

      if (parentId) {
        edges.push({
          id: `${parentId}->${nodeId}`,
          source: parentId,
          target: nodeId,
          style: { stroke: "oklch(0.5 0 0 / 25%)", strokeWidth: 1.5, transition: "all 0.2s ease" },
          animated: type === "api",
        });
      }

      yOffset += NODE_HEIGHT + VERTICAL_GAP;
      return startY;
    }

    const childYPositions: number[] = [];
    for (const child of childEntries) {
      const childY = traverse(child, depth + 1, nodeId);
      childYPositions.push(childY);
    }

    const nodeY =
      childYPositions.length === 1
        ? childYPositions[0]
        : (childYPositions[0] + childYPositions[childYPositions.length - 1]) / 2;

    nodes.push({
      id: nodeId,
      position: { x, y: nodeY },
      data: { label, nodeType: type, fullPath: node.fullPath },
      style: makeNodeStyle(type, "normal"),
      type: "default",
    });

    if (parentId) {
      edges.push({
        id: `${parentId}->${nodeId}`,
        source: parentId,
        target: nodeId,
        style: { stroke: "oklch(0.5 0 0 / 25%)", strokeWidth: 1.5, transition: "all 0.2s ease" },
        animated: type === "api",
      });
    }

    return nodeY;
  }

  traverse(root, 0, null);
  return { nodes, edges };
}

function matchesFilter(type: NodeType, filter: FilterMode): boolean {
  if (filter === "all") return true;
  if (filter === "pages") return type === "page" || type === "both" || type === "directory";
  return type === "api" || type === "both" || type === "directory";
}

function SitemapGraphInner({
  pageRoutes,
  apiRoutes,
  startUrl,
}: SitemapGraphProps): React.JSX.Element {
  const crawlMessages = useCrawlMessagesContext();
  const messages = crawlMessages.sitemap;
  const [filter, setFilter] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { fitView } = useReactFlow();

  const { baseNodes, baseEdges } = useMemo(() => {
    let hostname: string;
    try {
      hostname = new URL(startUrl).hostname;
    } catch {
      hostname = startUrl;
    }

    const tree = buildTree(pageRoutes, apiRoutes);
    const { nodes, edges } = layoutTree(tree, hostname);
    return { baseNodes: nodes, baseEdges: edges };
  }, [pageRoutes, apiRoutes, startUrl]);

  const searchMatches = useMemo(() => {
    if (!debouncedSearch) return new Set<string>();
    const lowerSearch = debouncedSearch.toLowerCase();
    return new Set(
      baseNodes
        .filter((n) => (n.data.fullPath as string).toLowerCase().includes(lowerSearch))
        .map((n) => n.id),
    );
  }, [baseNodes, debouncedSearch]);

  const styledNodes = useMemo(() => {
    const hasSearch = debouncedSearch.length > 0;
    const hasSelection = selectedNodeId !== null;

    return baseNodes.map((node) => {
      const type = node.data.nodeType as NodeType;
      const filtered = matchesFilter(type, filter);

      if (!filtered) {
        return { ...node, style: makeNodeStyle(type, "dimmed"), hidden: true };
      }

      if (hasSearch) {
        const isMatch = searchMatches.has(node.id);
        return { ...node, style: makeNodeStyle(type, isMatch ? "search-match" : "dimmed") };
      }

      if (hasSelection) {
        const isSelected = node.id === selectedNodeId;
        return { ...node, style: makeNodeStyle(type, isSelected ? "highlighted" : "dimmed") };
      }

      return { ...node, style: makeNodeStyle(type, "normal") };
    });
  }, [baseNodes, filter, debouncedSearch, searchMatches, selectedNodeId]);

  const styledEdges = useMemo(() => {
    const hiddenNodeIds = new Set(styledNodes.filter((n) => n.hidden).map((n) => n.id));
    const hasSearch = debouncedSearch.length > 0;
    const hasSelection = selectedNodeId !== null;

    return baseEdges.map((edge) => {
      if (hiddenNodeIds.has(edge.source) || hiddenNodeIds.has(edge.target)) {
        return { ...edge, hidden: true };
      }

      if (hasSearch || hasSelection) {
        const relevantIds = hasSearch ? searchMatches : new Set([selectedNodeId]);
        const isRelevant = relevantIds.has(edge.source) || relevantIds.has(edge.target);
        return {
          ...edge,
          style: {
            ...edge.style,
            stroke: isRelevant ? HIGHLIGHT_RING : "oklch(0.5 0 0 / 10%)",
            strokeWidth: isRelevant ? 2 : 1,
          },
        };
      }

      return edge;
    });
  }, [baseEdges, styledNodes, debouncedSearch, searchMatches, selectedNodeId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(styledNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(styledEdges);

  useEffect(() => { setNodes(styledNodes); }, [styledNodes, setNodes]);
  useEffect(() => { setEdges(styledEdges); }, [styledEdges, setEdges]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      setSelectedNodeId((current) => (current === node.id ? null : node.id));
      setSearch("");
    },
    [],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const onInit = useCallback(
    (instance: { fitView: () => void }) => {
      setTimeout(() => instance.fitView(), 50);
    },
    [],
  );

  const selectedInfo = useMemo(() => {
    if (!selectedNodeId) return null;
    const node = baseNodes.find((n) => n.id === selectedNodeId);
    if (!node) return null;
    return {
      path: node.data.fullPath as string,
      type: node.data.nodeType as NodeType,
    };
  }, [baseNodes, selectedNodeId]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      setSelectedNodeId(null);
      if (!value) return;
      setTimeout(() => fitView({ duration: 300 }), 50);
    },
    [fitView],
  );

  if (pageRoutes.length === 0 && apiRoutes.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center text-muted-foreground">
        {messages.noRoutes}
      </div>
    );
  }

  const filterButtons: { mode: FilterMode; label: string }[] = [
    { mode: "all", label: messages.filterAll },
    { mode: "pages", label: messages.filterPages },
    { mode: "apis", label: messages.filterApis },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder={messages.searchPlaceholder}
          aria-label={messages.searchPlaceholder}
          className="sm:max-w-xs"
        />
        <div className="flex gap-1">
          {filterButtons.map(({ mode, label }) => (
            <button
              key={mode}
              type="button"
              onClick={() => { setFilter(mode); setSelectedNodeId(null); }}
              className={cn(
                "inline-flex h-7 cursor-pointer items-center rounded-full border px-3 text-xs font-medium transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                filter === mode
                  ? "border-primary/25 bg-primary text-primary-foreground"
                  : "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
              )}
              aria-pressed={filter === mode}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: NODE_COLORS.page.bg, border: `1px solid ${NODE_COLORS.page.border}` }} />
            {messages.legendPage}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: NODE_COLORS.api.bg, border: `1px solid ${NODE_COLORS.api.border}` }} />
            {messages.legendApi}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: NODE_COLORS.directory.bg, border: `1px solid ${NODE_COLORS.directory.border}` }} />
            {messages.legendDirectory}
          </span>
        </div>

        {selectedInfo ? (
          <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-xs">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: NODE_COLORS[selectedInfo.type].border }} />
            <span className="font-mono font-medium">{selectedInfo.path}</span>
            <button
              type="button"
              onClick={() => setSelectedNodeId(null)}
              className="ml-1 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
              aria-label={messages.clearSelection}
            >
              ✕
            </button>
          </div>
        ) : null}

        {debouncedSearch && searchMatches.size > 0 ? (
          <span className="text-xs text-muted-foreground">
            {messages.matchesFound(searchMatches.size)}
          </span>
        ) : null}
      </div>

      <div className="h-[560px] overflow-hidden rounded-lg border bg-background [&_.react-flow__controls]:border [&_.react-flow__controls]:border-border [&_.react-flow__controls]:rounded-lg [&_.react-flow__controls]:overflow-hidden [&_.react-flow__controls]:shadow-md [&_.react-flow__controls-button]:border-b [&_.react-flow__controls-button]:border-border [&_.react-flow__controls-button]:bg-background [&_.react-flow__controls-button]:fill-foreground [&_.react-flow__controls-button]:hover:bg-muted [&_.react-flow__minimap]:border [&_.react-flow__minimap]:border-border [&_.react-flow__minimap]:rounded-lg [&_.react-flow__minimap]:overflow-hidden [&_.react-flow__minimap]:shadow-md">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onInit={onInit}
          fitView
          minZoom={0.1}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          className="dark"
        >
          <Background gap={20} size={1} />
          <Controls showInteractive={false} />
          <MiniMap
            nodeStrokeWidth={3}
            pannable
            zoomable
            style={{ height: 80, width: 120 }}
            maskColor="oklch(0.15 0 0 / 70%)"
            bgColor="oklch(0.15 0 0)"
            nodeColor={(node) => {
              const type = node.data?.nodeType as NodeType | undefined;
              return type ? NODE_COLORS[type].border : "oklch(0.5 0 0 / 30%)";
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export function SitemapGraph(props: SitemapGraphProps): React.JSX.Element {
  return (
    <ReactFlowProvider>
      <SitemapGraphInner {...props} />
    </ReactFlowProvider>
  );
}
