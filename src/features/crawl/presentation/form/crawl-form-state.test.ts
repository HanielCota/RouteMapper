import { AUTH_STRATEGY } from "@/features/crawl/domain/crawl-config";
import {
  CRAWL_FORM_SUBMISSION_BLOCKER,
  buildCrawlPayload,
  createInitialCrawlFormState,
  getCrawlFormSubmissionBlocker,
  validateCrawlPayload,
} from "@/features/crawl/presentation/form/crawl-form-state";

describe("crawl-form-state", () => {
  it("serializes manual form authentication into the crawl payload", () => {
    const state = createInitialCrawlFormState();
    state.url = "https://example.com";
    state.authMode = "manual";
    state.manualAuthStrategy = AUTH_STRATEGY.FORM;
    state.manualFormAuth.loginUrl = "https://example.com/login";
    state.manualFormAuth.username = "user@example.com";
    state.manualFormAuth.password = "secret";

    expect(buildCrawlPayload(state).auth).toMatchObject({
      strategy: AUTH_STRATEGY.FORM,
      loginUrl: "https://example.com/login",
      username: "user@example.com",
      password: "secret",
    });
  });

  it("serializes auto-auth into the same domain contract", () => {
    const state = createInitialCrawlFormState();
    state.url = "https://example.com";
    state.authMode = "auto";
    state.autoAuth.config = {
      loginUrl: "https://example.com/login",
      usernameSelector: "#email",
      passwordSelector: "#password",
      submitSelector: "button[type='submit']",
      isPasswordOnly: false,
    };
    state.autoAuth.credentials.username = "user@example.com";
    state.autoAuth.credentials.password = "secret";

    expect(buildCrawlPayload(state).auth).toMatchObject({
      strategy: AUTH_STRATEGY.FORM,
      loginUrl: "https://example.com/login",
      username: "user@example.com",
      password: "secret",
      usernameSelector: "#email",
    });
  });

  it("validates the serialized payload against the domain schema", () => {
    const state = createInitialCrawlFormState();
    state.url = "https://example.com";

    const parsed = validateCrawlPayload(state);
    expect(parsed.success).toBe(true);
  });

  it("blocks submission while auto-auth detection is still running", () => {
    const state = createInitialCrawlFormState();
    state.url = "https://example.com";

    expect(
      getCrawlFormSubmissionBlocker(state, {
        isDetectingAuth: true,
        authDetectionError: null,
      }),
    ).toBe(CRAWL_FORM_SUBMISSION_BLOCKER.DETECTING_AUTO_AUTH);
  });

  it("blocks submission when auto-auth detection failed", () => {
    const state = createInitialCrawlFormState();
    state.url = "https://example.com";

    expect(
      getCrawlFormSubmissionBlocker(state, {
        isDetectingAuth: false,
        authDetectionError: "Some detection error",
      }),
    ).toBe(CRAWL_FORM_SUBMISSION_BLOCKER.AUTO_AUTH_DETECTION_FAILED);
  });

  it("blocks submission until detected auto-auth is explicitly activated", () => {
    const state = createInitialCrawlFormState();
    state.url = "https://example.com";
    state.autoAuth.config = {
      loginUrl: "https://example.com/login",
      usernameSelector: "#email",
      passwordSelector: "#password",
      submitSelector: "button[type='submit']",
      isPasswordOnly: false,
    };

    expect(
      getCrawlFormSubmissionBlocker(state, {
        isDetectingAuth: false,
        authDetectionError: null,
      }),
    ).toBe(CRAWL_FORM_SUBMISSION_BLOCKER.AUTO_AUTH_NOT_ACTIVATED);
  });
});
