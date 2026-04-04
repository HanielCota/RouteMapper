import "server-only";

import {
  CREDENTIAL_TYPE,
  isBearerAuthConfig,
  isFormAuthConfig,
  isStorageStateAuthConfig,
} from "@/features/crawl/domain/crawl-config";
import { CrawlInventory } from "@/features/crawl/domain/crawl-inventory";
import { HostScopePolicy, normalizeUrl } from "@/features/crawl/domain/url-policy";
import { PlaywrightAuthenticator } from "@/features/crawl/infrastructure/playwright/playwright-authenticator";
import { PlaywrightBrowserFactory } from "@/features/crawl/infrastructure/playwright/playwright-browser-factory";
import { PlaywrightPageExplorer } from "@/features/crawl/infrastructure/playwright/playwright-page-explorer";
import type {
  CrawlExecutionCallbacks,
  CrawlExecutorPort,
} from "@/features/crawl/application/ports";
import type { CrawlInput, CrawlResult } from "@/features/crawl/domain/crawl-config";
import type { Browser, BrowserContext, Page } from "playwright";

export class PlaywrightCrawlExecutor implements CrawlExecutorPort {
  constructor(
    private readonly browserFactory: PlaywrightBrowserFactory,
    private readonly authenticator: PlaywrightAuthenticator,
  ) {}

  async run(
    config: CrawlInput,
    callbacks: CrawlExecutionCallbacks,
  ): Promise<CrawlResult> {
    const inventory = new CrawlInventory(config.url, config.allowedHostsMode);
    const scopePolicy = new HostScopePolicy(config.url, config.allowedHostsMode);
    const pageExplorer = new PlaywrightPageExplorer(
      inventory,
      config.maxClicksPerPage,
      config.interactionIdleTimeoutMs,
    );

    let browser: Browser | null = null;
    let context: BrowserContext | null = null;

    try {
      browser = await this.browserFactory.createBrowser();
      this.log(inventory, callbacks, "Navegador iniciado");

      const storageStateJson = isStorageStateAuthConfig(config.auth)
        ? config.auth.storageState
        : undefined;
      context = await this.browserFactory.createContext(browser, storageStateJson);
      this.log(inventory, callbacks, "Contexto do navegador criado");

      if (isBearerAuthConfig(config.auth)) {
        const headerName = config.auth.headerName;
        const headerValue = config.auth.headerPrefix
          ? `${config.auth.headerPrefix} ${config.auth.token}`
          : config.auth.token;

        await context.route("**/*", async (route) => {
          await route.continue({
            headers: {
              ...route.request().headers(),
              [headerName]: headerValue,
            },
          });
        });
        this.log(inventory, callbacks, `Header ${headerName} configurado`);
      }

      context.on("request", (request) => {
        inventory.recordRequest(
          request.url(),
          request.resourceType(),
          request.method(),
        );

        const headers = request.headers();
        for (const [name, value] of Object.entries(headers)) {
          const lowerName = name.toLowerCase();
          if (
            lowerName === "authorization" ||
            lowerName === "x-api-key" ||
            lowerName === "x-auth-token" ||
            lowerName === "x-access-token"
          ) {
            inventory.recordCredential(
              CREDENTIAL_TYPE.HEADER,
              name,
              value,
              request.url(),
            );
          }
        }
      });

      const page = await context.newPage();
      await this.authenticate(config, page, inventory, callbacks);
      if (callbacks.signal.aborted) {
        return inventory.buildResult(new Date().toISOString());
      }

      await this.captureCredentials(context, page, inventory);

      await this.crawlPages(
        config,
        page,
        inventory,
        scopePolicy,
        pageExplorer,
        callbacks,
      );
      await this.captureCredentials(context, page, inventory);
      this.log(inventory, callbacks, "Varredura concluída");

      return inventory.buildResult(new Date().toISOString());
    } finally {
      await Promise.allSettled([
        context?.close(),
        browser?.close(),
      ]);
    }
  }

  private async authenticate(
    config: CrawlInput,
    page: Page,
    inventory: CrawlInventory,
    callbacks: CrawlExecutionCallbacks,
  ): Promise<void> {
    if (!isFormAuthConfig(config.auth)) {
      return;
    }

    this.log(
      inventory,
      callbacks,
      `Autenticando via formulário em ${config.auth.loginUrl}`,
    );
    await this.authenticator.loginWithForm(page, config.auth);
    this.log(inventory, callbacks, "Autenticação bem-sucedida");
  }

  private async crawlPages(
    config: CrawlInput,
    page: Page,
    inventory: CrawlInventory,
    scopePolicy: HostScopePolicy,
    pageExplorer: PlaywrightPageExplorer,
    callbacks: CrawlExecutionCallbacks,
  ): Promise<void> {
    let pagesVisited = 0;

    while (pagesVisited < config.maxPages) {
      if (callbacks.signal.aborted) {
        this.log(inventory, callbacks, "Varredura cancelada pelo usuário");
        return;
      }

      const nextUrl = inventory.claimNextUrl();
      if (!nextUrl) {
        this.log(inventory, callbacks, "Sem mais URLs na fila");
        return;
      }

      if (inventory.hasVisited(nextUrl)) {
        continue;
      }

      inventory.markVisited(nextUrl);
      pagesVisited += 1;

      this.log(
        inventory,
        callbacks,
        `[${pagesVisited}/${config.maxPages}] Visitando: ${nextUrl}`,
      );
      this.emitProgress(callbacks, inventory, pagesVisited, nextUrl, config.maxPages);

      await this.visitPage(
        page,
        nextUrl,
        config,
        inventory,
        scopePolicy,
        pageExplorer,
        callbacks,
      );
    }
  }

  private async visitPage(
    page: Page,
    targetUrl: string,
    config: CrawlInput,
    inventory: CrawlInventory,
    scopePolicy: HostScopePolicy,
    pageExplorer: PlaywrightPageExplorer,
    callbacks: CrawlExecutionCallbacks,
  ): Promise<void> {
    try {
      await page.goto(targetUrl, {
        waitUntil: "domcontentloaded",
        timeout: config.timeoutMs,
      });

      this.recordVisitedPage(inventory, page, targetUrl, callbacks);
      if (callbacks.signal.aborted) {
        return;
      }

      await pageExplorer.autoScroll(page);
      const discoveredAnchors = await pageExplorer.collectAnchors(page);
      if (discoveredAnchors.length > 0) {
        this.log(
          inventory,
          callbacks,
          `  ${discoveredAnchors.length} novo(s) link(s) encontrado(s)`,
        );
      }

      if (callbacks.signal.aborted) {
        return;
      }

      await pageExplorer.exploreInteractions(page, (navigationUrl) => {
        const normalizedUrl = normalizeUrl(navigationUrl);
        if (!scopePolicy.allows(normalizedUrl)) {
          return;
        }

        const queued = inventory.queueDiscoveredUrl(normalizedUrl);
        if (!queued) {
          return;
        }

        this.log(
          inventory,
          callbacks,
          `  Interação navegou para: ${normalizedUrl}`,
        );
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      inventory.recordError(targetUrl, message);
      this.log(inventory, callbacks, `  Erro: ${message}`);

      await page
        .goto("about:blank", { waitUntil: "commit", timeout: 5000 })
        .catch(() => undefined);
    }
  }

  private recordVisitedPage(
    inventory: CrawlInventory,
    page: Page,
    originalUrl: string,
    callbacks: CrawlExecutionCallbacks,
  ): void {
    const currentUrl = page.url();
    inventory.recordPageRoute(currentUrl);

    const redirected = normalizeUrl(currentUrl) !== normalizeUrl(originalUrl);
    if (!redirected) {
      return;
    }

    inventory.recordPageRoute(originalUrl);
    this.log(inventory, callbacks, `  Redirecionado para: ${currentUrl}`);
  }

  private emitProgress(
    callbacks: CrawlExecutionCallbacks,
    inventory: CrawlInventory,
    pagesVisited: number,
    currentUrl: string,
    maxPages: number,
  ): void {
    callbacks.onProgress({
      pagesVisited,
      maxPages,
      currentUrl,
      pagesInQueue: inventory.getQueueLength(),
    });
  }

  private async captureCredentials(
    context: BrowserContext,
    page: Page,
    inventory: CrawlInventory,
  ): Promise<void> {
    try {
      const cookies = await context.cookies();
      const authCookiePatterns = [
        "token", "session", "auth", "jwt", "access", "sid",
        "csrf", "xsrf", "_at", "_rt",
      ];

      for (const cookie of cookies) {
        const lowerName = cookie.name.toLowerCase();
        const isAuthCookie = authCookiePatterns.some((p) => lowerName.includes(p));
        if (isAuthCookie && cookie.value.length > 8) {
          inventory.recordCredential(
            CREDENTIAL_TYPE.COOKIE,
            cookie.name,
            cookie.value,
            cookie.domain,
          );
        }
      }
    } catch {
      // cookies not available
    }

    try {
      const storageTokens = await page.evaluate(() => {
        const tokenPatterns = [
          "token", "auth", "jwt", "access", "session", "bearer", "api_key",
        ];
        const results: Array<{ type: "localStorage" | "sessionStorage"; name: string; value: string }> = [];

        for (const storage of [
          { store: window.localStorage, type: "localStorage" as const },
          { store: window.sessionStorage, type: "sessionStorage" as const },
        ]) {
          for (let i = 0; i < storage.store.length; i++) {
            const key = storage.store.key(i);
            if (!key) continue;
            const lowerKey = key.toLowerCase();
            const matches = tokenPatterns.some((p) => lowerKey.includes(p));
            if (!matches) continue;
            const value = storage.store.getItem(key);
            if (value && value.length > 8) {
              results.push({ type: storage.type, name: key, value });
            }
          }
        }

        return results;
      });

      for (const item of storageTokens) {
        inventory.recordCredential(
          item.type === "localStorage"
            ? CREDENTIAL_TYPE.LOCAL_STORAGE
            : CREDENTIAL_TYPE.SESSION_STORAGE,
          item.name,
          item.value,
          page.url(),
        );
      }
    } catch {
      // page context not available
    }
  }

  private log(
    inventory: CrawlInventory,
    callbacks: CrawlExecutionCallbacks,
    message: string,
  ): void {
    inventory.recordLog(message);
    callbacks.onLog(message);
  }
}
