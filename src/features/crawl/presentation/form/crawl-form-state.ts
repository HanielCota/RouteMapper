import {
  AUTH_DEFAULTS,
  AUTH_STRATEGY,
  CRAWLER_DEFAULTS,
  crawlInputSchema,
} from "@/features/crawl/domain/crawl-config";
import type {
  AllowedHostsMode,
  AuthStrategy,
  CrawlInput,
  DetectedLoginConfig,
} from "@/features/crawl/domain/crawl-config";

export interface AutoAuthCredentials {
  username: string;
  password: string;
  rememberMe: boolean;
}

export interface ManualFormAuthDraft {
  loginUrl: string;
  username: string;
  password: string;
  usernameSelector: string;
  passwordSelector: string;
  submitSelector: string;
  rememberMeSelector: string;
  successUrl: string;
  successSelector: string;
  postSubmitTimeoutMs: string;
}

export interface ManualStorageStateDraft {
  storageState: string;
}

export interface ManualBearerDraft {
  token: string;
  headerName: string;
  headerPrefix: string;
}

export interface AutoAuthState {
  config: DetectedLoginConfig | null;
  credentials: AutoAuthCredentials;
  saveCredentials: boolean;
}

export interface CrawlFormState {
  url: string;
  maxPages: string;
  maxClicksPerPage: string;
  timeoutMs: string;
  navigationIdleTimeoutMs: string;
  interactionIdleTimeoutMs: string;
  allowedHostsMode: AllowedHostsMode;
  isAdvancedOpen: boolean;
  authMode: "none" | "manual" | "auto";
  manualAuthStrategy: AuthStrategy;
  manualFormAuth: ManualFormAuthDraft;
  manualStorageState: ManualStorageStateDraft;
  manualBearer: ManualBearerDraft;
  autoAuth: AutoAuthState;
  errors: Record<string, string>;
}

export interface CrawlFormUiState {
  isDetectingAuth: boolean;
  authDetectionError: string | null;
}

export const CRAWL_FORM_SUBMISSION_BLOCKER = {
  DETECTING_AUTO_AUTH: "detecting-auto-auth",
  AUTO_AUTH_DETECTION_FAILED: "auto-auth-detection-failed",
  AUTO_AUTH_NOT_ACTIVATED: "auto-auth-not-activated",
} as const;

export type CrawlFormSubmissionBlocker =
  (typeof CRAWL_FORM_SUBMISSION_BLOCKER)[keyof typeof CRAWL_FORM_SUBMISSION_BLOCKER];

export function createInitialAutoAuthCredentials(): AutoAuthCredentials {
  return {
    username: "",
    password: "",
    rememberMe: true,
  };
}

export function createInitialCrawlFormState(): CrawlFormState {
  return {
    url: "",
    maxPages: String(CRAWLER_DEFAULTS.maxPages),
    maxClicksPerPage: String(CRAWLER_DEFAULTS.maxClicksPerPage),
    timeoutMs: String(CRAWLER_DEFAULTS.timeoutMs),
    navigationIdleTimeoutMs: String(CRAWLER_DEFAULTS.navigationIdleTimeoutMs),
    interactionIdleTimeoutMs: String(CRAWLER_DEFAULTS.interactionIdleTimeoutMs),
    allowedHostsMode: CRAWLER_DEFAULTS.allowedHostsMode,
    isAdvancedOpen: false,
    authMode: "none",
    manualAuthStrategy: AUTH_STRATEGY.FORM,
    manualFormAuth: {
      loginUrl: "",
      username: "",
      password: "",
      usernameSelector: AUTH_DEFAULTS.login.usernameSelector,
      passwordSelector: AUTH_DEFAULTS.login.passwordSelector,
      submitSelector: AUTH_DEFAULTS.login.submitSelector,
      rememberMeSelector: "",
      successUrl: "",
      successSelector: "",
      postSubmitTimeoutMs: String(AUTH_DEFAULTS.login.postSubmitTimeoutMs),
    },
    manualStorageState: {
      storageState: "",
    },
    manualBearer: {
      token: "",
      headerName: "Authorization",
      headerPrefix: "Bearer",
    },
    autoAuth: {
      config: null,
      credentials: createInitialAutoAuthCredentials(),
      saveCredentials: true,
    },
    errors: {},
  };
}

export function flattenZodErrors(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>,
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of issues) {
    const fullPath = issue.path.join(".");
    const normalizedPath = fullPath.startsWith("auth.") ? fullPath.slice(5) : fullPath;
    fieldErrors[normalizedPath] = issue.message;
  }

  return fieldErrors;
}

export function isAutoAuthPanelVisible(
  state: CrawlFormState,
  uiState: CrawlFormUiState,
): boolean {
  if (state.authMode === "auto") {
    return true;
  }

  if (state.autoAuth.config) {
    return true;
  }

  if (uiState.isDetectingAuth) {
    return true;
  }

  return uiState.authDetectionError !== null;
}

export function getCrawlFormSubmissionBlocker(
  state: CrawlFormState,
  uiState: CrawlFormUiState,
): CrawlFormSubmissionBlocker | null {
  if (!isAutoAuthPanelVisible(state, uiState)) {
    return null;
  }

  if (uiState.isDetectingAuth) {
    return CRAWL_FORM_SUBMISSION_BLOCKER.DETECTING_AUTO_AUTH;
  }

  if (uiState.authDetectionError) {
    return CRAWL_FORM_SUBMISSION_BLOCKER.AUTO_AUTH_DETECTION_FAILED;
  }

  if (state.authMode === "auto") {
    return null;
  }

  if (!state.autoAuth.config) {
    return null;
  }

  return CRAWL_FORM_SUBMISSION_BLOCKER.AUTO_AUTH_NOT_ACTIVATED;
}

function buildAutoAuthPayload(state: CrawlFormState): CrawlInput["auth"] {
  const config = state.autoAuth.config;
  if (!config) {
    return undefined;
  }

  return {
    strategy: AUTH_STRATEGY.FORM,
    loginUrl: config.loginUrl,
    username: state.autoAuth.credentials.username || undefined,
    password: state.autoAuth.credentials.password,
    usernameSelector: config.usernameSelector,
    passwordSelector: config.passwordSelector,
    submitSelector: config.submitSelector,
    rememberMeSelector: config.rememberMeSelector,
    successUrl: config.successUrl,
    postSubmitTimeoutMs: AUTH_DEFAULTS.login.postSubmitTimeoutMs,
  };
}

function buildManualAuthPayload(state: CrawlFormState): CrawlInput["auth"] {
  if (state.manualAuthStrategy === AUTH_STRATEGY.BEARER) {
    return {
      strategy: AUTH_STRATEGY.BEARER,
      token: state.manualBearer.token,
      headerName: state.manualBearer.headerName || "Authorization",
      headerPrefix: state.manualBearer.headerPrefix,
    };
  }

  if (state.manualAuthStrategy === AUTH_STRATEGY.STORAGE_STATE) {
    return {
      strategy: AUTH_STRATEGY.STORAGE_STATE,
      storageState: state.manualStorageState.storageState,
    };
  }

  return {
    strategy: AUTH_STRATEGY.FORM,
    loginUrl: state.manualFormAuth.loginUrl,
    username: state.manualFormAuth.username || undefined,
    password: state.manualFormAuth.password,
    usernameSelector: state.manualFormAuth.usernameSelector || undefined,
    passwordSelector:
      state.manualFormAuth.passwordSelector || AUTH_DEFAULTS.login.passwordSelector,
    submitSelector:
      state.manualFormAuth.submitSelector || AUTH_DEFAULTS.login.submitSelector,
    rememberMeSelector: state.manualFormAuth.rememberMeSelector || undefined,
    successUrl: state.manualFormAuth.successUrl || undefined,
    successSelector: state.manualFormAuth.successSelector || undefined,
    postSubmitTimeoutMs:
      Number(state.manualFormAuth.postSubmitTimeoutMs) ||
      AUTH_DEFAULTS.login.postSubmitTimeoutMs,
  };
}

export function buildCrawlPayload(state: CrawlFormState): CrawlInput {
  const auth =
    state.authMode === "auto"
      ? buildAutoAuthPayload(state)
      : state.authMode === "manual"
        ? buildManualAuthPayload(state)
        : undefined;

  return {
    url: state.url,
    maxPages: Number(state.maxPages),
    maxClicksPerPage: Number(state.maxClicksPerPage),
    timeoutMs: Number(state.timeoutMs),
    navigationIdleTimeoutMs: Number(state.navigationIdleTimeoutMs),
    interactionIdleTimeoutMs: Number(state.interactionIdleTimeoutMs),
    allowedHostsMode: state.allowedHostsMode,
    auth,
  };
}

export function validateCrawlPayload(state: CrawlFormState) {
  return crawlInputSchema.safeParse(buildCrawlPayload(state));
}
