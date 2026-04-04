import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginFormNotFoundError } from "@/features/crawl/infrastructure/playwright/playwright-login-detector";
import { apiErrorMessages } from "@/shared/messages/api-error-messages";

const { detectLoginMock } = vi.hoisted(() => ({
  detectLoginMock: vi.fn(),
}));

vi.mock("@/features/crawl/infrastructure/server-runtime", () => ({
  getCrawlService: () => ({
    detectLogin: detectLoginMock,
  }),
}));

import { POST } from "./route";

describe("POST /api/detect-login", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns the detected login form payload", async () => {
    detectLoginMock.mockResolvedValue({
      loginUrl: "https://example.com/login",
      usernameSelector: "#email",
      passwordSelector: "#password",
      submitSelector: "button[type='submit']",
      isPasswordOnly: false,
    });

    const response = await POST(
      new Request("http://localhost/api/detect-login", {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      loginUrl: "https://example.com/login",
    });
  });

  it("maps no-form-detected failures to 404", async () => {
    detectLoginMock.mockRejectedValue(new LoginFormNotFoundError());

    const response = await POST(
      new Request("http://localhost/api/detect-login", {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com" }),
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: apiErrorMessages.noLoginForm,
    });
  });
});
