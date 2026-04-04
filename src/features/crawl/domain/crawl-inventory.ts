import { RESOURCE_TYPE } from "@/features/crawl/domain/crawl-config";
import { HostScopePolicy, normalizeUrl, parseUrl, routePatternFromPath } from "@/features/crawl/domain/url-policy";
import type {
  AllowedHostsMode,
  ApiRoute,
  CapturedCredential,
  CrawlError,
  CrawlResult,
  CredentialType,
  PageRoute,
} from "@/features/crawl/domain/crawl-config";

interface ApiRouteEntry {
  path: string;
  methods: Set<string>;
  observedUrls: Set<string>;
}

const IGNORED_RESOURCE_TYPES = new Set([
  "document",
  "websocket",
  "eventsource",
  "manifest",
  "other",
]);

const MAX_DISCOVERED_URLS = 10000;

export class CrawlInventory {
  private readonly scopePolicy: HostScopePolicy;
  private readonly visitedUrls = new Set<string>();
  private readonly discoveredUrls = new Set<string>();
  private readonly pageRoutes: PageRoute[] = [];
  private readonly apiRoutes = new Map<string, ApiRouteEntry>();
  private readonly assetRequests = new Set<string>();
  private readonly externalRequests = new Set<string>();
  private readonly errors: CrawlError[] = [];
  private readonly capturedCredentials = new Map<string, CapturedCredential>();
  private readonly logs: string[] = [];
  private readonly urlQueue: string[] = [];

  constructor(
    private readonly startUrl: string,
    allowedHostsMode: AllowedHostsMode,
  ) {
    this.scopePolicy = new HostScopePolicy(startUrl, allowedHostsMode);

    const normalizedStartUrl = normalizeUrl(startUrl);
    this.discoveredUrls.add(normalizedStartUrl);
    this.urlQueue.push(normalizedStartUrl);
  }

  hasVisited(url: string): boolean {
    return this.visitedUrls.has(normalizeUrl(url));
  }

  getQueueLength(): number {
    return this.urlQueue.length;
  }

  getVisitedCount(): number {
    return this.visitedUrls.size;
  }

  getDiscoveredCount(): number {
    return this.discoveredUrls.size;
  }

  claimNextUrl(): string | undefined {
    return this.urlQueue.shift();
  }

  markVisited(url: string): void {
    this.visitedUrls.add(normalizeUrl(url));
  }

  queueDiscoveredUrl(url: string): boolean {
    if (!this.scopePolicy.allows(url)) {
      return false;
    }

    const normalizedUrl = normalizeUrl(url);
    if (this.discoveredUrls.has(normalizedUrl)) {
      return false;
    }

    if (this.discoveredUrls.size >= MAX_DISCOVERED_URLS) {
      return false;
    }

    this.discoveredUrls.add(normalizedUrl);

    if (!this.visitedUrls.has(normalizedUrl)) {
      this.urlQueue.push(normalizedUrl);
    }

    return true;
  }

  recordPageRoute(url: string): void {
    const parsedUrl = parseUrl(url);
    if (!parsedUrl) {
      return;
    }

    const normalizedUrl = normalizeUrl(url);
    const isDuplicate = this.pageRoutes.some((route) => route.url === normalizedUrl);
    if (isDuplicate) {
      return;
    }

    this.pageRoutes.push({
      url: normalizedUrl,
      path: parsedUrl.pathname,
      query: parsedUrl.search,
      pattern: routePatternFromPath(parsedUrl.pathname),
    });
  }

  recordCredential(
    type: CredentialType,
    name: string,
    value: string,
    source: string,
  ): void {
    const key = `${type}:${name}:${value}`;
    if (this.capturedCredentials.has(key)) {
      return;
    }

    this.capturedCredentials.set(key, { type, name, value, source });
  }

  recordRequest(requestUrl: string, resourceType: string, method: string): void {
    const parsedUrl = parseUrl(requestUrl);
    if (!parsedUrl) {
      return;
    }

    const isApiRequest =
      resourceType === RESOURCE_TYPE.XHR || resourceType === RESOURCE_TYPE.FETCH;
    if (!this.scopePolicy.allows(requestUrl)) {
      if (!isApiRequest) {
        return;
      }

      this.externalRequests.add(requestUrl);
      return;
    }

    if (isApiRequest) {
      this.recordApiRoute(parsedUrl.pathname, method, requestUrl);
      return;
    }

    if (IGNORED_RESOURCE_TYPES.has(resourceType)) {
      return;
    }

    this.assetRequests.add(requestUrl);
  }

  recordError(url: string, message: string): void {
    this.errors.push({ url, message });
  }

  recordLog(message: string): void {
    this.logs.push(message);
  }

  buildResult(scannedAt: string): CrawlResult {
    return {
      summary: {
        startUrl: this.startUrl,
        pagesVisited: this.getVisitedCount(),
        pagesDiscovered: this.getDiscoveredCount(),
        apiRoutesDiscovered: this.getApiRoutes().length,
        assetsObserved: this.getAssetRequests().length,
        externalRequestsObserved: this.getExternalRequests().length,
        errors: this.getErrors().length,
        scannedAt,
      },
      pageRoutes: this.getPageRoutes(),
      apiRoutes: this.getApiRoutes(),
      assetRequests: this.getAssetRequests(),
      externalRequests: this.getExternalRequests(),
      capturedCredentials: this.getCapturedCredentials(),
      logs: this.getLogs(),
      errors: this.getErrors(),
    };
  }

  getPageRoutes(): PageRoute[] {
    return [...this.pageRoutes].sort((left, right) => left.url.localeCompare(right.url));
  }

  getApiRoutes(): ApiRoute[] {
    return [...this.apiRoutes.entries()]
      .map(([pattern, entry]) => ({
        path: entry.path,
        pattern,
        methods: [...entry.methods].sort(),
        observedUrls: [...entry.observedUrls].sort(),
      }))
      .sort((left, right) => left.pattern.localeCompare(right.pattern));
  }

  getAssetRequests(): string[] {
    return [...this.assetRequests].sort();
  }

  getExternalRequests(): string[] {
    return [...this.externalRequests].sort();
  }

  getErrors(): CrawlError[] {
    return [...this.errors];
  }

  getCapturedCredentials(): CapturedCredential[] {
    return [...this.capturedCredentials.values()];
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  private recordApiRoute(path: string, method: string, requestUrl: string): void {
    const pattern = routePatternFromPath(path);
    const existingEntry = this.apiRoutes.get(pattern);
    if (!existingEntry) {
      this.apiRoutes.set(pattern, {
        path,
        methods: new Set([method.toUpperCase()]),
        observedUrls: new Set([requestUrl]),
      });
      return;
    }

    existingEntry.methods.add(method.toUpperCase());
    existingEntry.observedUrls.add(requestUrl);
  }
}
