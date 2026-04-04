import "server-only";

import type { FormAuthConfig } from "@/features/crawl/domain/crawl-config";
import type { Page } from "playwright";

const ELEMENT_VISIBLE_TIMEOUT_MS = 5000;
const REMEMBER_ME_TIMEOUT_MS = 2000;
const SUBMIT_ENABLED_TIMEOUT_MS = 3000;
const INPUT_SETTLE_TIMEOUT_MS = 150;

export class PlaywrightAuthenticator {
  async loginWithForm(page: Page, config: FormAuthConfig): Promise<void> {
    this.validateSelectors(config);
    await page.goto(config.loginUrl, { waitUntil: "domcontentloaded" });
    await this.fillCredentials(page, config);
    await this.checkRememberMe(page, config.rememberMeSelector);
    await this.submitAndWait(page, config);
    await this.validateLogin(page, config);
  }

  private validateSelectors(config: FormAuthConfig): void {
    const selectorFields = [
      { name: "usernameSelector", value: config.usernameSelector },
      { name: "passwordSelector", value: config.passwordSelector },
      { name: "submitSelector", value: config.submitSelector },
      { name: "rememberMeSelector", value: config.rememberMeSelector },
      { name: "successSelector", value: config.successSelector },
    ];

    const tailwindArbitraryPattern = /\[&[_>~+]|\bhas-\[/;

    for (const { name, value } of selectorFields) {
      if (!value) {
        continue;
      }

      if (tailwindArbitraryPattern.test(value)) {
        throw new Error(
          `Invalid CSS selector for ${name}: "${value.slice(0, 80)}…" — ` +
            "use #id, [name], [data-testid], or [aria-label]",
        );
      }
    }
  }

  private async fillCredentials(
    page: Page,
    config: FormAuthConfig,
  ): Promise<void> {
    let usernameInput:
      | ReturnType<Page["locator"]>
      | undefined;

    if (config.usernameSelector && config.username) {
      usernameInput = page.locator(config.usernameSelector);
      await usernameInput.waitFor({
        state: "visible",
        timeout: ELEMENT_VISIBLE_TIMEOUT_MS,
      });
      await usernameInput.fill(config.username);
    }

    const passwordInput = page.locator(config.passwordSelector);
    await passwordInput.waitFor({
      state: "visible",
      timeout: ELEMENT_VISIBLE_TIMEOUT_MS,
    });
    await passwordInput.fill(config.password);
    await usernameInput?.blur().catch(() => undefined);
    await passwordInput.blur().catch(() => undefined);
    await page.waitForTimeout(INPUT_SETTLE_TIMEOUT_MS);
  }

  private async checkRememberMe(
    page: Page,
    selector?: string,
  ): Promise<void> {
    if (!selector) {
      return;
    }

    try {
      const checkbox = page.locator(selector);
      await checkbox.waitFor({
        state: "visible",
        timeout: REMEMBER_ME_TIMEOUT_MS,
      });
      await checkbox.check();
    } catch {
      return;
    }
  }

  private async submitAndWait(
    page: Page,
    config: FormAuthConfig,
  ): Promise<void> {
    const submitButton = page.locator(config.submitSelector);
    await submitButton.waitFor({
      state: "visible",
      timeout: ELEMENT_VISIBLE_TIMEOUT_MS,
    });

    await this.waitForSubmitButtonToEnable(submitButton);

    await Promise.all([
      page
        .waitForLoadState("networkidle", {
          timeout: config.postSubmitTimeoutMs,
        })
        .catch(() => undefined),
      this.triggerSubmit(page, config, submitButton),
    ]);
  }

  private async waitForSubmitButtonToEnable(
    submitButton: ReturnType<Page["locator"]>,
  ): Promise<void> {
    try {
      await submitButton.waitFor({
        state: "attached",
        timeout: SUBMIT_ENABLED_TIMEOUT_MS,
      });
      await expectPoll(
        async () => !(await submitButton.isDisabled()),
        SUBMIT_ENABLED_TIMEOUT_MS,
      );
    } catch {
      return;
    }
  }

  private async triggerSubmit(
    page: Page,
    config: FormAuthConfig,
    submitButton: ReturnType<Page["locator"]>,
  ): Promise<void> {
    if (!(await submitButton.isDisabled().catch(() => true))) {
      await this.dispatchSubmit(page, config.submitSelector);
      return;
    }

    const passwordInput = page.locator(config.passwordSelector);
    await passwordInput.press("Enter").catch(() => undefined);
    await page.waitForTimeout(INPUT_SETTLE_TIMEOUT_MS);

    if (!(await submitButton.isDisabled().catch(() => true))) {
      await this.dispatchSubmit(page, config.submitSelector);
      return;
    }

    await this.requestFormSubmit(page, config.submitSelector);
  }

  private async dispatchSubmit(
    page: Page,
    submitSelector: string,
  ): Promise<void> {
    const clicked = await page.evaluate((selector) => {
      const submitElement = document.querySelector<
        HTMLButtonElement | HTMLInputElement
      >(selector);

      if (!submitElement) {
        return false;
      }

      submitElement.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        }),
      );

      return true;
    }, submitSelector);

    if (!clicked) {
      throw new Error(`Login submit failed: button not found for "${submitSelector}"`);
    }
  }

  private async requestFormSubmit(
    page: Page,
    submitSelector: string,
  ): Promise<void> {
    const submitted = await page.evaluate((selector) => {
      const submitElement = document.querySelector<
        HTMLButtonElement | HTMLInputElement
      >(selector);
      const form =
        submitElement?.closest("form") ??
        document.querySelector<HTMLFormElement>("form");

      if (!form) {
        return false;
      }

      const fields = Array.from(
        form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
          "input, textarea, select",
        ),
      );
      for (const field of fields) {
        field.dispatchEvent(new Event("input", { bubbles: true }));
        field.dispatchEvent(new Event("change", { bubbles: true }));
        field.dispatchEvent(new Event("blur", { bubbles: true }));
      }

      if (typeof form.requestSubmit === "function") {
        form.requestSubmit(
          submitElement instanceof HTMLElement ? submitElement : undefined,
        );
        return true;
      }

      return form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    }, submitSelector);

    if (!submitted) {
      throw new Error(`Login submit failed: form not found for "${submitSelector}"`);
    }
  }

  private async validateLogin(
    page: Page,
    config: FormAuthConfig,
  ): Promise<void> {
    if (config.successUrl) {
      const currentUrl = page.url();
      if (!matchesExpectedSuccessUrl(currentUrl, config.successUrl)) {
        throw new Error(
          `Login validation failed: expected "${config.successUrl}", got "${currentUrl}"`,
        );
      }
    }

    if (!config.successSelector) {
      return;
    }

    try {
      await page.locator(config.successSelector).waitFor({
        state: "visible",
        timeout: ELEMENT_VISIBLE_TIMEOUT_MS,
      });
    } catch {
      throw new Error(
        `Login validation failed: selector "${config.successSelector}" not found`,
      );
    }
  }
}

async function expectPoll(
  assertion: () => Promise<boolean>,
  timeoutMs: number,
): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await assertion()) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error("Timed out waiting for predicate");
}

export function matchesExpectedSuccessUrl(
  currentUrl: string,
  expectedSuccessUrl: string,
): boolean {
  const current = parseUrl(currentUrl);
  if (!current) {
    return false;
  }

  const expected = parseExpectedSuccessUrl(expectedSuccessUrl, current.origin);
  if (!expected) {
    return false;
  }

  if (expected.pathname === "/") {
    return false;
  }

  if (expected.origin !== current.origin) {
    return false;
  }

  if (current.pathname === expected.pathname) {
    return true;
  }

  return current.pathname.startsWith(`${expected.pathname}/`);
}

function parseExpectedSuccessUrl(
  expectedSuccessUrl: string,
  origin: string,
): URL | null {
  try {
    return new URL(expectedSuccessUrl, origin);
  } catch {
    return null;
  }
}

function parseUrl(rawUrl: string): URL | null {
  try {
    return new URL(rawUrl);
  } catch {
    return null;
  }
}
