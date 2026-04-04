/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { PlaywrightLoginDetector, inferSuccessUrlFromPageUrl } from "@/features/crawl/infrastructure/playwright/playwright-login-detector";

describe("inferSuccessUrlFromPageUrl", () => {
  it("does not infer root or login routes as a success target", () => {
    expect(inferSuccessUrlFromPageUrl("https://example.com/")).toBeNull();
    expect(
      inferSuccessUrlFromPageUrl("https://example.com/login?next=%2Fdashboard"),
    ).toBeNull();
  });

  it("prefers known dashboard-style paths when available", () => {
    expect(
      inferSuccessUrlFromPageUrl("https://example.com/admin/users"),
    ).toBe("/admin");
    expect(
      inferSuccessUrlFromPageUrl("https://example.com/dashboard/settings"),
    ).toBe("/dashboard");
  });

  it("falls back to the current path for non-login pages", () => {
    expect(
      inferSuccessUrlFromPageUrl("https://example.com/workspace/overview"),
    ).toBe("/workspace/overview");
  });
});

describe("PlaywrightLoginDetector selector generation", () => {
  it("generates a full CSS path selector for elements without unique attributes", async () => {
    document.body.innerHTML = `
      <form>
        <input type="email" name="email" />
        <input type="password" name="password" />
        <button class="inline-flex [&_svg:not([class*='size-'])]:size-4 hover:bg-primary/90">
          Entrar
        </button>
      </form>
    `;

    const detector = new PlaywrightLoginDetector({} as never);
    const fakePage = {
      evaluate: async <T,>(
        callback: (params: {
          usernameSelector: string;
          passwordSelector: string;
          submitSelector: string;
          loginKeywords: string[];
          rememberMeSelector: string;
        }) => T,
        params: {
          usernameSelector: string;
          passwordSelector: string;
          submitSelector: string;
          loginKeywords: string[];
          rememberMeSelector: string;
        },
      ) => callback(params),
    };

    const detectedConfig = await (
      detector as unknown as {
        detectLoginForm(page: typeof fakePage): Promise<{
          submitSelector: string;
          passwordSelector: string;
          usernameSelector?: string;
        } | null>;
      }
    ).detectLoginForm(fakePage);

    expect(detectedConfig).not.toBeNull();
    expect(detectedConfig?.submitSelector).not.toContain("[&_svg");
    expect(detectedConfig?.submitSelector).not.toContain(".");
    expect(detectedConfig?.submitSelector).toContain(">");
    expect(document.querySelector(detectedConfig!.submitSelector)).toBe(
      document.querySelector("button"),
    );
  });
});
