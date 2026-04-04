import "server-only";

import { PlaywrightBrowserFactory } from "@/features/crawl/infrastructure/playwright/playwright-browser-factory";
import type { DetectedLoginConfig } from "@/features/crawl/domain/crawl-config";
import type { LoginDetectorPort } from "@/features/crawl/application/ports";
import type { Page } from "playwright";

const PAGE_LOAD_TIMEOUT_MS = 30000;

const USERNAME_INPUT_SELECTOR = [
  'input[type="email"]',
  'input[type="text"][name*="user"]',
  'input[type="text"][name*="login"]',
  'input[type="text"][name*="email"]',
  'input[name*="email"]',
  'input[name*="user"]',
  'input[name*="username"]',
  'input[id*="email"]',
  'input[id*="user"]',
  'input[id*="login"]',
].join(", ");

const PASSWORD_INPUT_SELECTOR = [
  'input[type="password"]',
  'input[name*="password"]',
  'input[id*="password"]',
].join(", ");

const SUBMIT_BUTTON_SELECTOR = [
  'button[type="submit"]',
  "button:not([type])",
  'input[type="submit"]',
].join(", ");

const LOGIN_BUTTON_KEYWORDS = [
  "login",
  "sign in",
  "entrar",
  "acessar",
  "submit",
  "enviar",
];

const REMEMBER_ME_SELECTOR = [
  'input[type="checkbox"][name*="remember"]',
  'input[type="checkbox"][name*="keep"]',
  'input[type="checkbox"][id*="remember"]',
].join(", ");

const DASHBOARD_PATHS = [
  "/dashboard",
  "/home",
  "/account",
  "/profile",
  "/app",
  "/admin",
];

const LOGIN_PATH_KEYWORDS = ["login", "signin", "auth"];

export class LoginFormNotFoundError extends Error {
  constructor() {
    super("No login form detected");
    this.name = "LoginFormNotFoundError";
  }
}

export class PlaywrightLoginDetector implements LoginDetectorPort {
  constructor(private readonly browserFactory: PlaywrightBrowserFactory) {}

  async detect(url: string): Promise<DetectedLoginConfig> {
    let browser = null;
    let context = null;

    try {
      browser = await this.browserFactory.createBrowser();
      context = await this.browserFactory.createContext(browser);
      const page = await context.newPage();

      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: PAGE_LOAD_TIMEOUT_MS,
      });

      const detectedForm = await this.detectLoginForm(page);
      if (!detectedForm) {
        throw new LoginFormNotFoundError();
      }

      const successUrl = await this.detectSuccessUrl(page);
      if (!successUrl) {
        return detectedForm;
      }

      return {
        ...detectedForm,
        successUrl,
      };
    } finally {
      await context?.close().catch(() => undefined);
      await browser?.close().catch(() => undefined);
    }
  }

  private async detectLoginForm(
    page: Page,
  ): Promise<DetectedLoginConfig | null> {
    try {
      return await page.evaluate(
        (params: {
          usernameSelector: string;
          passwordSelector: string;
          submitSelector: string;
          loginKeywords: string[];
          rememberMeSelector: string;
        }) => {
          function escapeCssToken(value: string): string {
            if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
              return CSS.escape(value);
            }

            return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
          }

          const passwordInput = document.querySelector(params.passwordSelector);
          if (!passwordInput) {
            return null;
          }

          const passwordField = passwordInput;
          const usernameInput = document.querySelector(params.usernameSelector);

          function buildUniqueSegment(element: Element): string {
            const tagName = element.tagName.toLowerCase();

            if (element.id) {
              return `#${escapeCssToken(element.id)}`;
            }

            const elementName = element.getAttribute("name");
            if (elementName) {
              return `${tagName}[name="${escapeCssToken(elementName)}"]`;
            }

            const dataTestId = element.getAttribute("data-testid");
            if (dataTestId) {
              return `${tagName}[data-testid="${escapeCssToken(dataTestId)}"]`;
            }

            const ariaLabel = element.getAttribute("aria-label");
            if (ariaLabel) {
              return `${tagName}[aria-label="${escapeCssToken(ariaLabel)}"]`;
            }

            const type = element.getAttribute("type");
            if (type) {
              return `${tagName}[type="${escapeCssToken(type)}"]`;
            }

            return tagName;
          }

          function buildSelector(element: Element): string {
            const segments: string[] = [];
            let current: Element | null = element;

            while (current && current !== document.documentElement) {
              const segment = buildUniqueSegment(current);

              if (segment.startsWith("#")) {
                segments.unshift(segment);
                break;
              }

              const parent: Element | null = current.parentElement;
              if (parent) {
                const tagName = current.tagName;
                const sameTagSiblings = Array.from(parent.children).filter(
                  (child) => child.tagName === tagName,
                );
                if (sameTagSiblings.length > 1) {
                  const index = sameTagSiblings.indexOf(current) + 1;
                  segments.unshift(`${segment}:nth-of-type(${index})`);
                } else {
                  segments.unshift(segment);
                }
              } else {
                segments.unshift(segment);
              }

              current = parent;
            }

            return segments.join(" > ");
          }

          function getSubmitButtonSelector(): string {
            const form =
              passwordField.closest("form") ?? usernameInput?.closest("form");

            if (form) {
              const directSubmit = form.querySelector(params.submitSelector);
              if (directSubmit) {
                return buildSelector(directSubmit);
              }

              for (const button of form.querySelectorAll("button")) {
                const text = button.textContent?.toLowerCase() ?? "";
                const matches = params.loginKeywords.some((keyword) =>
                  text.includes(keyword),
                );
                if (matches) {
                  return buildSelector(button);
                }
              }
            }

            for (const button of document.querySelectorAll(
              'button, input[type="submit"]',
            )) {
              const text = button.textContent?.toLowerCase() ?? "";
              const matches = params.loginKeywords.some((keyword) =>
                text.includes(keyword),
              );
              if (matches) {
                return buildSelector(button);
              }
            }

            return 'button[type="submit"]';
          }

          const rememberMeInput = document.querySelector(params.rememberMeSelector);
          return {
            loginUrl: window.location.href,
            usernameSelector: usernameInput
              ? buildSelector(usernameInput)
              : undefined,
            passwordSelector: buildSelector(passwordField),
            submitSelector: getSubmitButtonSelector(),
            rememberMeSelector: rememberMeInput
              ? buildSelector(rememberMeInput)
              : undefined,
            isPasswordOnly: !usernameInput,
          };
        },
        {
          usernameSelector: USERNAME_INPUT_SELECTOR,
          passwordSelector: PASSWORD_INPUT_SELECTOR,
          submitSelector: SUBMIT_BUTTON_SELECTOR,
          loginKeywords: LOGIN_BUTTON_KEYWORDS,
          rememberMeSelector: REMEMBER_ME_SELECTOR,
        },
      );
    } catch {
      return null;
    }
  }

  private async detectSuccessUrl(page: Page): Promise<string | null> {
    try {
      return inferSuccessUrlFromPageUrl(page.url());
    } catch {
      return null;
    }
  }
}

export function inferSuccessUrlFromPageUrl(pageUrl: string): string | null {
  const currentUrl = new URL(pageUrl);
  const path = currentUrl.pathname;
  if (!path || path === "/") {
    return null;
  }

  const lowerPath = path.toLowerCase();
  const dashboardPath = DASHBOARD_PATHS.find((candidatePath) =>
    lowerPath.includes(candidatePath),
  );
  if (dashboardPath) {
    return dashboardPath;
  }

  const isLoginPath = LOGIN_PATH_KEYWORDS.some((keyword) =>
    lowerPath.includes(keyword),
  );
  if (isLoginPath) {
    return null;
  }

  return path;
}
