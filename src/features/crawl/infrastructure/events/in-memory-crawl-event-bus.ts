import "server-only";

import type { CrawlEventBus } from "@/features/crawl/application/ports";
import type { CrawlEvent, CrawlEventListener } from "@/features/crawl/domain/crawl-event";

export class InMemoryCrawlEventBus implements CrawlEventBus {
  private readonly listeners = new Map<string, Set<CrawlEventListener>>();

  async publish(jobId: string, event: CrawlEvent): Promise<void> {
    const jobListeners = this.listeners.get(jobId);
    if (!jobListeners) {
      return;
    }

    for (const listener of jobListeners) {
      try {
        listener(event);
      } catch {
        continue;
      }
    }
  }

  subscribe(jobId: string, listener: CrawlEventListener): () => void {
    const currentListeners = this.listeners.get(jobId);
    if (currentListeners) {
      currentListeners.add(listener);
      return () => {
        currentListeners.delete(listener);
      };
    }

    const nextListeners = new Set<CrawlEventListener>([listener]);
    this.listeners.set(jobId, nextListeners);

    return () => {
      nextListeners.delete(listener);
      if (nextListeners.size > 0) {
        return;
      }

      this.listeners.delete(jobId);
    };
  }

  clear(jobId: string): void {
    this.listeners.delete(jobId);
  }
}
