import { describe, expect, it } from "vitest";
import {
  PlaywrightAuthenticator,
  matchesExpectedSuccessUrl,
} from "@/features/crawl/infrastructure/playwright/playwright-authenticator";
import type { FormAuthConfig } from "@/features/crawl/domain/crawl-config";

describe("PlaywrightAuthenticator selector validation", () => {
  it("rejects selectors that contain Tailwind arbitrary variants", async () => {
    const authenticator = new PlaywrightAuthenticator();
    const config: FormAuthConfig = {
      loginUrl: "https://example.com/login",
      username: "user",
      password: "pass",
      usernameSelector: 'input[name="email"]',
      passwordSelector: 'input[type="password"]',
      submitSelector:
        ".inline-flex.[&_svg]:pointer-events-none.has-[>svg]:px-3",
      postSubmitTimeoutMs: 5000,
    };

    await expect(
      authenticator.loginWithForm({} as never, config),
    ).rejects.toThrow("Invalid CSS selector for submitSelector");
  });

  it("accepts valid CSS selectors", async () => {
    const authenticator = new PlaywrightAuthenticator();
    const config: FormAuthConfig = {
      loginUrl: "https://example.com/login",
      username: "user",
      password: "pass",
      usernameSelector: 'input[name="email"]',
      passwordSelector: 'input[type="password"]',
      submitSelector: 'button[type="submit"]',
      postSubmitTimeoutMs: 5000,
    };

    // Should not throw on validation, will throw on page.goto since page is null
    await expect(
      authenticator.loginWithForm({} as never, config),
    ).rejects.not.toThrow("Invalid CSS selector");
  });
});

describe("matchesExpectedSuccessUrl", () => {
  it("rejects login pages that only mention the target route in query params", () => {
    expect(
      matchesExpectedSuccessUrl(
        "https://example.com/login?next=%2Fdashboard",
        "/dashboard",
      ),
    ).toBe(false);
  });

  it("accepts exact path matches and nested paths below the target", () => {
    expect(
      matchesExpectedSuccessUrl("https://example.com/dashboard", "/dashboard"),
    ).toBe(true);
    expect(
      matchesExpectedSuccessUrl(
        "https://example.com/dashboard/settings",
        "/dashboard",
      ),
    ).toBe(true);
  });

  it("rejects root as a valid success target", () => {
    expect(
      matchesExpectedSuccessUrl("https://example.com/dashboard", "/"),
    ).toBe(false);
  });
});

describe("PlaywrightAuthenticator submit fallback", () => {
  it("submits the form without clicking when the submit button stays disabled", async () => {
    const authenticator = new PlaywrightAuthenticator();
    const actions: string[] = [];

    const submitLocator = {
      waitFor: async () => {
        actions.push("submit:waitFor");
      },
      isDisabled: async () => true,
      click: async () => {
        actions.push("submit:click");
      },
      blur: async () => {
        actions.push("submit:blur");
      },
    };
    const passwordLocator = {
      waitFor: async () => {
        actions.push("password:waitFor");
      },
      fill: async () => {
        actions.push("password:fill");
      },
      blur: async () => {
        actions.push("password:blur");
      },
      press: async (key: string) => {
        actions.push(`password:press:${key}`);
      },
    };
    const usernameLocator = {
      waitFor: async () => {
        actions.push("username:waitFor");
      },
      fill: async () => {
        actions.push("username:fill");
      },
      blur: async () => {
        actions.push("username:blur");
      },
    };

    const page = {
      goto: async () => {
        actions.push("page:goto");
      },
      locator: (selector: string) => {
        if (selector === 'input[name="email"]') {
          return usernameLocator;
        }

        if (selector === 'input[type="password"]') {
          return passwordLocator;
        }

        if (selector === 'button[type="submit"]') {
          return submitLocator;
        }

        return {
          waitFor: async () => undefined,
          check: async () => undefined,
        };
      },
      waitForTimeout: async () => {
        actions.push("page:waitForTimeout");
      },
      waitForLoadState: async () => {
        actions.push("page:waitForLoadState");
      },
      evaluate: async () => {
        actions.push("page:evaluate");
        return true;
      },
      url: () => "https://example.com/dashboard",
    };

    const config: FormAuthConfig = {
      loginUrl: "https://example.com/login",
      username: "user@example.com",
      password: "pass",
      usernameSelector: 'input[name="email"]',
      passwordSelector: 'input[type="password"]',
      submitSelector: 'button[type="submit"]',
      postSubmitTimeoutMs: 5000,
      successUrl: "/dashboard",
    };

    await authenticator.loginWithForm(page as never, config);

    expect(actions).toContain("password:press:Enter");
    expect(actions).toContain("page:evaluate");
    expect(actions).not.toContain("submit:click");
  });
});
