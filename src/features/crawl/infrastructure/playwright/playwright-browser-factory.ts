import "server-only";

import { chromium } from "playwright";
import { CRAWLER_DEFAULTS } from "@/features/crawl/domain/crawl-config";
import type { Browser, BrowserContext } from "playwright";

export class PlaywrightBrowserFactory {
  async createBrowser(): Promise<Browser> {
    return chromium.launch({ headless: true });
  }

  async createContext(
    browser: Browser,
    storageStateJson?: string,
  ): Promise<BrowserContext> {
    const contextOptions: Parameters<Browser["newContext"]>[0] = {
      viewport: {
        width: CRAWLER_DEFAULTS.viewportWidth,
        height: CRAWLER_DEFAULTS.viewportHeight,
      },
      ignoreHTTPSErrors: true,
    };

    if (!storageStateJson) {
      return browser.newContext(contextOptions);
    }

    try {
      contextOptions.storageState = JSON.parse(storageStateJson);
    } catch {
      throw new Error("Invalid storageState JSON");
    }

    return browser.newContext(contextOptions);
  }
}
