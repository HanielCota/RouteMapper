import "server-only";

import { CRAWLER_DEFAULTS } from "@/features/crawl/domain/crawl-config";
import { isNavigableUrl, parseUrl, sleep } from "@/features/crawl/domain/url-policy";
import type { CrawlInventory } from "@/features/crawl/domain/crawl-inventory";
import type { Frame, Page } from "playwright";

const SCROLL_SETTLE_MS = 300;
const CLICK_TIMEOUT_MS = 1500;
const GO_BACK_TIMEOUT_MS = 3000;

const INTERACTIVE_SELECTORS = [
  "button:not([disabled])",
  '[role="button"]:not([disabled])',
  "[onclick]",
  "[tabindex]:not(a):not(input):not(select):not(textarea)",
] as const;

export class PlaywrightPageExplorer {
  constructor(
    private readonly inventory: CrawlInventory,
    private readonly maxClicksPerPage: number,
    private readonly interactionIdleTimeoutMs: number,
  ) {}

  async autoScroll(page: Page): Promise<void> {
    await page.evaluate(
      async (params: { steps: number; stepPx: number }) => {
        for (let index = 0; index < params.steps; index += 1) {
          window.scrollBy(0, params.stepPx);
          await new Promise((resolve) => setTimeout(resolve, 150));
        }

        window.scrollTo(0, 0);
      },
      {
        steps: CRAWLER_DEFAULTS.autoScrollSteps,
        stepPx: CRAWLER_DEFAULTS.autoScrollStepPx,
      },
    );

    await sleep(SCROLL_SETTLE_MS);
  }

  async collectAnchors(page: Page): Promise<string[]> {
    const hrefs = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll("a[href]"),
        (anchor) => (anchor as HTMLAnchorElement).href,
      ),
    );

    const discoveredUrls: string[] = [];
    for (const href of hrefs) {
      if (!isNavigableUrl(href)) {
        continue;
      }

      const parsedHref = parseUrl(href);
      if (!parsedHref) {
        continue;
      }

      if (parsedHref.protocol !== "http:" && parsedHref.protocol !== "https:") {
        continue;
      }

      const queued = this.inventory.queueDiscoveredUrl(href);
      if (!queued) {
        continue;
      }

      discoveredUrls.push(href);
    }

    return discoveredUrls;
  }

  async exploreInteractions(
    page: Page,
    onNavigation: (url: string) => void,
  ): Promise<void> {
    if (this.maxClicksPerPage <= 0) {
      return;
    }

    const interactiveCount = await this.countInteractiveElements(page);
    const clickLimit = Math.min(this.maxClicksPerPage, interactiveCount);
    if (clickLimit === 0) {
      return;
    }

    const handleFrameNavigated = (frame: Frame): void => {
      if (frame !== page.mainFrame()) {
        return;
      }

      const frameUrl = frame.url();
      if (!frameUrl || frameUrl === "about:blank") {
        return;
      }

      onNavigation(frameUrl);
    };

    page.on("framenavigated", handleFrameNavigated);

    try {
      await this.clickElements(page, clickLimit, onNavigation);
    } finally {
      page.off("framenavigated", handleFrameNavigated);
    }
  }

  private async countInteractiveElements(page: Page): Promise<number> {
    return page.evaluate((selectors: readonly string[]) => {
      const elements = new Set<Element>();
      for (const selector of selectors) {
        document.querySelectorAll(selector).forEach((element) => {
          elements.add(element);
        });
      }

      return elements.size;
    }, INTERACTIVE_SELECTORS);
  }

  private async clickElements(
    page: Page,
    clickLimit: number,
    onNavigation: (url: string) => void,
  ): Promise<void> {
    for (let index = 0; index < clickLimit; index += 1) {
      try {
        await this.clickElementAtIndex(page, index, onNavigation);
      } catch {
        continue;
      }
    }
  }

  private async clickElementAtIndex(
    page: Page,
    index: number,
    onNavigation: (url: string) => void,
  ): Promise<void> {
    const elementHandle = await page.evaluateHandle(
      (params: { selectors: readonly string[]; targetIndex: number }) => {
        const elements: Element[] = [];
        const seenElements = new Set<Element>();

        for (const selector of params.selectors) {
          document.querySelectorAll(selector).forEach((element) => {
            if (seenElements.has(element)) {
              return;
            }

            seenElements.add(element);
            elements.push(element);
          });
        }

        return elements[params.targetIndex] ?? null;
      },
      { selectors: INTERACTIVE_SELECTORS, targetIndex: index },
    );

    const element = elementHandle.asElement();
    if (!element) {
      await elementHandle.dispose();
      return;
    }

    try {
      const isVisible = await element.isVisible().catch(() => false);
      if (!isVisible) {
        return;
      }

      const urlBeforeClick = page.url();
      await element.click({ timeout: CLICK_TIMEOUT_MS }).catch(() => undefined);
      await page
        .waitForLoadState("networkidle", {
          timeout: this.interactionIdleTimeoutMs,
        })
        .catch(() => undefined);

      const urlAfterClick = page.url();
      const hasNavigated =
        urlAfterClick !== urlBeforeClick && urlAfterClick !== "about:blank";

      if (!hasNavigated) {
        return;
      }

      onNavigation(urlAfterClick);

      try {
        await page.goBack({
          waitUntil: "load",
          timeout: GO_BACK_TIMEOUT_MS,
        });
      } catch {
        throw new Error("Navigation recovery failed");
      }
    } finally {
      await elementHandle.dispose();
    }
  }
}
