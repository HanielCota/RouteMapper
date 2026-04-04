import "server-only";

import type { IdGenerator } from "@/features/crawl/application/ports";

export class UuidIdGenerator implements IdGenerator {
  generate(): string {
    return crypto.randomUUID();
  }
}
