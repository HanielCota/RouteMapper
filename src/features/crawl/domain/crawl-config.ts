import { z } from "zod";

export const CRAWL_STATUS = {
  QUEUED: "queued",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export type CrawlStatus = (typeof CRAWL_STATUS)[keyof typeof CRAWL_STATUS];

export const AUTH_STRATEGY = {
  FORM: "form",
  STORAGE_STATE: "storageState",
  BEARER: "bearer",
} as const;

export type AuthStrategy =
  (typeof AUTH_STRATEGY)[keyof typeof AUTH_STRATEGY];

export const ALLOWED_HOSTS_MODE = {
  SAME_ORIGIN: "same-origin",
  RELATED: "related",
} as const;

export type AllowedHostsMode =
  (typeof ALLOWED_HOSTS_MODE)[keyof typeof ALLOWED_HOSTS_MODE];

export const HTTP_METHOD = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
  OPTIONS: "OPTIONS",
  HEAD: "HEAD",
} as const;

export type HttpMethod = (typeof HTTP_METHOD)[keyof typeof HTTP_METHOD];

export const RESOURCE_TYPE = {
  XHR: "xhr",
  FETCH: "fetch",
} as const;

export const SSE_EVENT_TYPE = {
  PROGRESS: "progress",
  LOG: "log",
  DONE: "done",
  ERROR: "error",
} as const;

export type SseEventType = (typeof SSE_EVENT_TYPE)[keyof typeof SSE_EVENT_TYPE];

export const CRAWLER_DEFAULTS = {
  maxPages: 50,
  maxClicksPerPage: 20,
  timeoutMs: 15000,
  navigationIdleTimeoutMs: 3000,
  interactionIdleTimeoutMs: 1500,
  allowedHostsMode: ALLOWED_HOSTS_MODE.RELATED,
  viewportWidth: 1440,
  viewportHeight: 900,
  autoScrollSteps: 8,
  autoScrollStepPx: 1250,
} as const;

export const AUTH_DEFAULTS = {
  strategy: AUTH_STRATEGY.FORM,
  login: {
    usernameSelector: 'input[type="email"], input[name*="user"]',
    passwordSelector: 'input[type="password"]',
    submitSelector: 'button[type="submit"]',
    postSubmitTimeoutMs: 10000,
  },
} as const;

const urlSchema = z
  .string()
  .trim()
  .url("URL inválida / Invalid URL")
  .refine((value) => value.startsWith("http://") || value.startsWith("https://"), {
    message: "http:// ou https:// obrigatório / required",
  });

const TAILWIND_ARBITRARY_PATTERN = /\[&[_>~+]|\bhas-\[|\bshadow-\[|\bscale-\[/;

const cssSelectorSchema = z
  .string()
  .min(1)
  .refine((value) => !TAILWIND_ARBITRARY_PATTERN.test(value), {
    message: "Tailwind className — use #id, [name], [data-testid]",
  });

const formAuthSchema = z.object({
  strategy: z.literal(AUTH_STRATEGY.FORM),
  loginUrl: urlSchema,
  username: z.string().optional(),
  password: z.string().min(1),
  usernameSelector: cssSelectorSchema.optional(),
  passwordSelector: cssSelectorSchema.default(
    AUTH_DEFAULTS.login.passwordSelector,
  ),
  submitSelector: cssSelectorSchema.default(
    AUTH_DEFAULTS.login.submitSelector,
  ),
  rememberMeSelector: cssSelectorSchema.optional(),
  successUrl: z.string().optional(),
  successSelector: cssSelectorSchema.optional(),
  postSubmitTimeoutMs: z
    .number()
    .int()
    .min(1000)
    .default(AUTH_DEFAULTS.login.postSubmitTimeoutMs),
});

const storageStateAuthSchema = z.object({
  strategy: z.literal(AUTH_STRATEGY.STORAGE_STATE),
  storageState: z
    .string()
    .min(1)
    .refine((value) => {
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    }, "JSON inválido / Invalid JSON"),
});

const bearerAuthSchema = z.object({
  strategy: z.literal(AUTH_STRATEGY.BEARER),
  token: z.string().min(1),
  headerName: z.string().min(1).default("Authorization"),
  headerPrefix: z.string().default("Bearer"),
});

export const authConfigSchema = z.discriminatedUnion("strategy", [
  formAuthSchema,
  storageStateAuthSchema,
  bearerAuthSchema,
]);

export const crawlInputSchema = z.object({
  url: urlSchema,
  maxPages: z.number().int().min(1).default(CRAWLER_DEFAULTS.maxPages),
  maxClicksPerPage: z
    .number()
    .int()
    .min(0)
    .default(CRAWLER_DEFAULTS.maxClicksPerPage),
  timeoutMs: z.number().int().min(5000).default(CRAWLER_DEFAULTS.timeoutMs),
  navigationIdleTimeoutMs: z
    .number()
    .int()
    .min(1000)
    .default(CRAWLER_DEFAULTS.navigationIdleTimeoutMs),
  interactionIdleTimeoutMs: z
    .number()
    .int()
    .min(500)
    .default(CRAWLER_DEFAULTS.interactionIdleTimeoutMs),
  allowedHostsMode: z
    .enum([ALLOWED_HOSTS_MODE.SAME_ORIGIN, ALLOWED_HOSTS_MODE.RELATED])
    .default(CRAWLER_DEFAULTS.allowedHostsMode),
  auth: authConfigSchema.optional(),
});

export const detectLoginInputSchema = z.object({
  url: urlSchema,
});

export const detectedLoginConfigSchema = z.object({
  loginUrl: z.string(),
  usernameSelector: z.string().optional(),
  passwordSelector: z.string(),
  submitSelector: z.string(),
  rememberMeSelector: z.string().optional(),
  successUrl: z.string().optional(),
  isPasswordOnly: z.boolean(),
});

export const pageRouteSchema = z.object({
  url: z.string(),
  path: z.string(),
  query: z.string(),
  pattern: z.string(),
});

export const apiRouteSchema = z.object({
  path: z.string(),
  pattern: z.string(),
  methods: z.array(z.string()),
  observedUrls: z.array(z.string()),
});

export const crawlErrorSchema = z.object({
  url: z.string(),
  message: z.string(),
});

export const crawlSummarySchema = z.object({
  startUrl: z.string(),
  pagesVisited: z.number(),
  pagesDiscovered: z.number(),
  apiRoutesDiscovered: z.number(),
  assetsObserved: z.number(),
  externalRequestsObserved: z.number(),
  errors: z.number(),
  scannedAt: z.string(),
});

export const CREDENTIAL_TYPE = {
  HEADER: "header",
  COOKIE: "cookie",
  LOCAL_STORAGE: "localStorage",
  SESSION_STORAGE: "sessionStorage",
} as const;

export type CredentialType = (typeof CREDENTIAL_TYPE)[keyof typeof CREDENTIAL_TYPE];

export const capturedCredentialSchema = z.object({
  type: z.enum([
    CREDENTIAL_TYPE.HEADER,
    CREDENTIAL_TYPE.COOKIE,
    CREDENTIAL_TYPE.LOCAL_STORAGE,
    CREDENTIAL_TYPE.SESSION_STORAGE,
  ]),
  name: z.string(),
  value: z.string(),
  source: z.string(),
});

export const crawlResultSchema = z.object({
  summary: crawlSummarySchema,
  pageRoutes: z.array(pageRouteSchema),
  apiRoutes: z.array(apiRouteSchema),
  assetRequests: z.array(z.string()),
  externalRequests: z.array(z.string()),
  capturedCredentials: z.array(capturedCredentialSchema),
  logs: z.array(z.string()),
  errors: z.array(crawlErrorSchema),
});

export const crawlStatusSchema = z.enum([
  CRAWL_STATUS.QUEUED,
  CRAWL_STATUS.RUNNING,
  CRAWL_STATUS.COMPLETED,
  CRAWL_STATUS.FAILED,
  CRAWL_STATUS.CANCELLED,
]);

export const crawlProgressSchema = z.object({
  pagesVisited: z.number(),
  maxPages: z.number(),
  currentUrl: z.string(),
  pagesInQueue: z.number(),
});

export const crawlJobSnapshotSchema = z.object({
  id: z.string(),
  status: crawlStatusSchema,
  progress: crawlProgressSchema,
  result: crawlResultSchema.nullable(),
  error: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const crawlCreationResponseSchema = z.object({
  id: z.string().min(1),
});

export const crawlEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(SSE_EVENT_TYPE.PROGRESS),
    data: crawlProgressSchema,
  }),
  z.object({
    type: z.literal(SSE_EVENT_TYPE.LOG),
    data: z.object({ message: z.string() }),
  }),
  z.object({
    type: z.literal(SSE_EVENT_TYPE.DONE),
    data: z.object({ status: crawlStatusSchema }),
  }),
  z.object({
    type: z.literal(SSE_EVENT_TYPE.ERROR),
    data: z.object({ message: z.string() }),
  }),
]);

export type CrawlInput = z.infer<typeof crawlInputSchema>;
export type FormAuthConfig = z.infer<typeof formAuthSchema>;
export type StorageStateAuthConfig = z.infer<typeof storageStateAuthSchema>;
export type BearerAuthConfig = z.infer<typeof bearerAuthSchema>;
export type AuthConfig = z.infer<typeof authConfigSchema>;
export type DetectLoginInput = z.infer<typeof detectLoginInputSchema>;
export type DetectedLoginConfig = z.infer<typeof detectedLoginConfigSchema>;
export type PageRoute = z.infer<typeof pageRouteSchema>;
export type ApiRoute = z.infer<typeof apiRouteSchema>;
export type CrawlError = z.infer<typeof crawlErrorSchema>;
export type CapturedCredential = z.infer<typeof capturedCredentialSchema>;
export type CrawlSummary = z.infer<typeof crawlSummarySchema>;
export type CrawlResult = z.infer<typeof crawlResultSchema>;

export function isFormAuthConfig(
  authConfig: AuthConfig | undefined,
): authConfig is FormAuthConfig {
  return authConfig?.strategy === AUTH_STRATEGY.FORM;
}

export function isStorageStateAuthConfig(
  authConfig: AuthConfig | undefined,
): authConfig is StorageStateAuthConfig {
  return authConfig?.strategy === AUTH_STRATEGY.STORAGE_STATE;
}

export function isBearerAuthConfig(
  authConfig: AuthConfig | undefined,
): authConfig is BearerAuthConfig {
  return authConfig?.strategy === AUTH_STRATEGY.BEARER;
}
