import "server-only";

import type { Clock } from "@/features/crawl/application/ports";

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }

  nowIso(): string {
    return this.now().toISOString();
  }
}
