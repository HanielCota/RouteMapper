import { ALLOWED_HOSTS_MODE } from "@/features/crawl/domain/crawl-config";
import type { AllowedHostsMode } from "@/features/crawl/domain/crawl-config";

const UUID_PATTERN = /^[0-9a-f]+(-[0-9a-f]+){2,}$/i;
const NUMERIC_PATTERN = /^\d+$/;
const HEX_ID_PATTERN = /^[0-9a-f]{8,}$/i;
const TOKEN_PATTERN = /^[a-zA-Z0-9_-]{20,}$/;
const MIN_UUID_HEX_LENGTH = 16;

const NON_NAVIGABLE_PREFIXES = ["javascript:", "mailto:", "tel:", "#"] as const;

const MULTI_PART_TLDS = new Set([
  "co.uk",
  "org.uk",
  "ac.uk",
  "gov.uk",
  "com.br",
  "org.br",
  "net.br",
  "com.au",
  "org.au",
  "net.au",
  "co.jp",
  "or.jp",
  "ne.jp",
  "co.in",
  "org.in",
  "net.in",
  "co.kr",
  "or.kr",
  "co.za",
  "org.za",
  "net.za",
  "com.mx",
  "org.mx",
  "com.ar",
  "org.ar",
  "co.nz",
  "org.nz",
  "net.nz",
  "com.tr",
  "org.tr",
  "com.cn",
  "org.cn",
  "net.cn",
  "co.il",
  "com.pl",
  "org.pl",
  "net.pl",
]);

export function parseUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

export function normalizeUrl(raw: string): string {
  const parsed = parseUrl(raw);
  if (!parsed) {
    return raw;
  }

  parsed.hash = "";

  if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }

  const entries = [...new URLSearchParams(parsed.search).entries()];
  const sorted = new URLSearchParams(
    entries.sort((left, right) => left[0].localeCompare(right[0])),
  );
  parsed.search = sorted.toString() ? `?${sorted.toString()}` : "";

  return parsed.toString();
}

const IP_ADDRESS_PATTERN = /^(\d{1,3}\.){3}\d{1,3}$/;

function getBaseDomain(hostname: string): string {
  if (IP_ADDRESS_PATTERN.test(hostname) || hostname === "localhost") {
    return hostname;
  }

  const parts = hostname.split(".");
  if (parts.length <= 2) {
    return hostname;
  }

  const lastTwo = parts.slice(-2).join(".");
  if (MULTI_PART_TLDS.has(lastTwo)) {
    if (parts.length <= 3) {
      return hostname;
    }

    return parts.slice(-3).join(".");
  }

  return lastTwo;
}

function classifySegment(segment: string): string {
  if (!segment) {
    return segment;
  }

  const isUuid =
    UUID_PATTERN.test(segment) &&
    segment.replace(/-/g, "").length >= MIN_UUID_HEX_LENGTH;
  if (isUuid) {
    return ":uuid";
  }

  if (NUMERIC_PATTERN.test(segment)) {
    return ":number";
  }

  if (HEX_ID_PATTERN.test(segment)) {
    return ":id";
  }

  if (TOKEN_PATTERN.test(segment)) {
    return ":token";
  }

  return segment;
}

export function routePatternFromPath(path: string): string {
  return path.split("/").map(classifySegment).join("/");
}

export function isNavigableUrl(href: string): boolean {
  if (!href) {
    return false;
  }

  const normalized = href.toLowerCase().trim();
  return !NON_NAVIGABLE_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class HostScopePolicy {
  private readonly baseUrl: URL;

  constructor(
    startUrl: string,
    private readonly mode: AllowedHostsMode,
  ) {
    const parsed = parseUrl(startUrl);
    if (!parsed) {
      throw new Error(`Invalid start URL: ${startUrl}`);
    }

    this.baseUrl = parsed;
  }

  allows(rawUrl: string): boolean {
    const parsed = parseUrl(rawUrl);
    if (!parsed) {
      return false;
    }

    if (this.mode === ALLOWED_HOSTS_MODE.SAME_ORIGIN) {
      return parsed.origin === this.baseUrl.origin;
    }

    return getBaseDomain(parsed.hostname) === getBaseDomain(this.baseUrl.hostname);
  }
}
