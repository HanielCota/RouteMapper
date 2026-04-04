"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  crawlCreationResponseSchema,
  detectedLoginConfigSchema,
  detectLoginInputSchema,
} from "@/features/crawl/domain/crawl-config";
import { useCrawlMessagesContext } from "@/features/crawl/presentation/crawl-messages-context";
import {
  CRAWL_FORM_SUBMISSION_BLOCKER,
  buildCrawlPayload,
  createInitialAutoAuthCredentials,
  createInitialCrawlFormState,
  flattenZodErrors,
  getCrawlFormSubmissionBlocker,
  isAutoAuthPanelVisible,
  validateCrawlPayload,
} from "@/features/crawl/presentation/form/crawl-form-state";
import {
  extractCredentialDomain,
  getSavedCredential,
  saveCredential,
} from "@/features/crawl/presentation/auth/credentials-store";
import type {
  DetectedLoginConfig,
  AllowedHostsMode,
  AuthStrategy,
} from "@/features/crawl/domain/crawl-config";
import type {
  AutoAuthCredentials,
  CrawlFormState,
} from "@/features/crawl/presentation/form/crawl-form-state";

export function useCrawlFormController() {
  const router = useRouter();
  const crawlMessages = useCrawlMessagesContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingAuth, setIsDetectingAuth] = useState(false);
  const [authDetectionError, setAuthDetectionError] = useState<string | null>(null);
  const [state, setState] = useState<CrawlFormState>(createInitialCrawlFormState);
  const authDetectionRequestIdRef = useRef(0);

  const autoAuthUiState = {
    isDetectingAuth,
    authDetectionError,
  };
  const isAutoAuthVisible = isAutoAuthPanelVisible(state, autoAuthUiState);
  const submissionBlocker = getCrawlFormSubmissionBlocker(state, autoAuthUiState);

  const updateState = (
    updater: (currentState: CrawlFormState) => CrawlFormState,
  ): void => {
    setState((currentState) => updater(currentState));
  };

  const setField = <Field extends keyof CrawlFormState>(
    field: Field,
    value: CrawlFormState[Field],
  ): void => {
    updateState((currentState) => ({
      ...currentState,
      [field]: value,
    }));
  };

  const setAllowedHostsMode = (allowedHostsMode: AllowedHostsMode): void => {
    setField("allowedHostsMode", allowedHostsMode);
  };

  const setManualAuthStrategy = (strategy: AuthStrategy): void => {
    updateState((currentState) => ({
      ...currentState,
      manualAuthStrategy: strategy,
    }));
  };

  const setManualFormAuthField = (
    field: keyof CrawlFormState["manualFormAuth"],
    value: string,
  ): void => {
    updateState((currentState) => ({
      ...currentState,
      manualFormAuth: {
        ...currentState.manualFormAuth,
        [field]: value,
      },
    }));
  };

  const setManualBearerField = (
    field: keyof CrawlFormState["manualBearer"],
    value: string,
  ): void => {
    updateState((currentState) => ({
      ...currentState,
      manualBearer: {
        ...currentState.manualBearer,
        [field]: value,
      },
    }));
  };

  const setManualStorageState = (storageState: string): void => {
    updateState((currentState) => ({
      ...currentState,
      manualStorageState: {
        storageState,
      },
    }));
  };

  const setAuthMode = (authMode: CrawlFormState["authMode"]): void => {
    updateState((currentState) => ({
      ...currentState,
      authMode,
    }));
  };

  const setAutoAuthCredentials = (
    field: keyof AutoAuthCredentials,
    value: string | boolean,
  ): void => {
    updateState((currentState) => ({
      ...syncAutoAuthMode(
        {
          ...currentState,
          autoAuth: {
            ...currentState.autoAuth,
            credentials: {
              ...currentState.autoAuth.credentials,
              [field]: value,
            } as AutoAuthCredentials,
          },
        },
      ),
    }));
  };

  const setSaveCredentials = (saveCredentials: boolean): void => {
    updateState((currentState) => ({
      ...currentState,
      autoAuth: {
        ...currentState.autoAuth,
        saveCredentials,
      },
    }));
  };

  const enableAutoAuth = (config: DetectedLoginConfig): void => {
    const domain = extractCredentialDomain(state.url);
    const savedCredential = getSavedCredential(domain);

    updateState((currentState) =>
      syncAutoAuthMode({
        ...currentState,
        authMode: "auto",
        autoAuth: {
          ...currentState.autoAuth,
          config,
          credentials: {
            ...createInitialAutoAuthCredentials(),
            username: savedCredential?.email ?? "",
            password: currentState.autoAuth.credentials.password,
          },
        },
      }),
    );
    toast.success(crawlMessages.autoAuth.toastDetected);
  };

  const disableAutoAuth = (): void => {
    authDetectionRequestIdRef.current += 1;
    setIsDetectingAuth(false);
    updateState((currentState) => ({
      ...currentState,
      authMode: "none",
      autoAuth: {
        ...currentState.autoAuth,
        config: null,
        credentials: createInitialAutoAuthCredentials(),
      },
    }));
    setAuthDetectionError(null);
  };

  const detectAutoAuth = async (): Promise<void> => {
    setAuthDetectionError(null);

    const parsedInput = detectLoginInputSchema.safeParse({ url: state.url });
    if (!parsedInput.success) {
      const fieldErrors = flattenZodErrors(parsedInput.error.issues);
      updateState((currentState) => ({
        ...currentState,
        errors: fieldErrors,
      }));
      return;
    }

    const requestId = authDetectionRequestIdRef.current + 1;
    authDetectionRequestIdRef.current = requestId;
    setIsDetectingAuth(true);

    try {
      const response = await fetch("/api/detect-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedInput.data),
      });

      if (!response.ok) {
        const body = await response
          .json()
          .catch(() => ({ error: crawlMessages.autoAuth.toastDetectionFailed }));
        throw new Error(body.error || `HTTP ${response.status}`);
      }

      const parsed = detectedLoginConfigSchema.safeParse(await response.json());
      if (!parsed.success) {
        throw new Error(crawlMessages.autoAuth.toastDetectionFailed);
      }

      if (authDetectionRequestIdRef.current !== requestId) {
        return;
      }

      enableAutoAuth(parsed.data);
    } catch (error: unknown) {
      if (authDetectionRequestIdRef.current !== requestId) {
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : crawlMessages.autoAuth.toastDetectionError;
      setAuthDetectionError(message);
      toast.error(message);
    } finally {
      if (authDetectionRequestIdRef.current !== requestId) {
        return;
      }

      setIsDetectingAuth(false);
    }
  };

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    if (submissionBlocker) {
      const blockerMessages = {
        [CRAWL_FORM_SUBMISSION_BLOCKER.DETECTING_AUTO_AUTH]:
          crawlMessages.autoAuth.toastWaitForDetection,
        [CRAWL_FORM_SUBMISSION_BLOCKER.AUTO_AUTH_DETECTION_FAILED]:
          crawlMessages.autoAuth.toastResolveBeforeScan,
        [CRAWL_FORM_SUBMISSION_BLOCKER.AUTO_AUTH_NOT_ACTIVATED]:
          crawlMessages.autoAuth.toastEnableBeforeScan,
      } as const;
      const message = blockerMessages[submissionBlocker];
      toast.error(message);
      return;
    }

    updateState((currentState) => ({
      ...currentState,
      errors: {},
    }));

    const parsedPayload = validateCrawlPayload(state);
    if (!parsedPayload.success) {
      updateState((currentState) => ({
        ...currentState,
        errors: flattenZodErrors(parsedPayload.error.issues),
      }));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedPayload.data),
      });

      if (!response.ok) {
        const body = await response
          .json()
          .catch(() => ({ error: crawlMessages.form.toastScanFailed }));
        throw new Error(body.error || `HTTP ${response.status}`);
      }

      const parsed = crawlCreationResponseSchema.safeParse(await response.json());
      if (!parsed.success) {
        throw new Error(crawlMessages.form.toastScanFailed);
      }

      const body = parsed.data;
      saveCredentialsIfNeeded(state);
      toast.success(crawlMessages.form.toastScanStarted);
      router.push(`/results/${body.id}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : crawlMessages.form.toastScanFailed;
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    state,
    isSubmitting,
    isDetectingAuth,
    isAutoAuthVisible,
    submissionBlocker,
    authDetectionError,
    setField,
    setAllowedHostsMode,
    setManualAuthStrategy,
    setManualFormAuthField,
    setManualStorageState,
    setManualBearerField,
    setAuthMode,
    setAutoAuthCredentials,
    setSaveCredentials,
    detectAutoAuth,
    disableAutoAuth,
    submit,
    getEstimatedPayload: () => buildCrawlPayload(state),
  };
}

function saveCredentialsIfNeeded(state: CrawlFormState): void {
  if (state.authMode !== "auto") {
    return;
  }

  if (!state.autoAuth.saveCredentials) {
    return;
  }

  if (!state.autoAuth.credentials.username) {
    return;
  }

  const domain = extractCredentialDomain(state.url);
  saveCredential(domain, state.autoAuth.credentials.username);
}

function syncAutoAuthMode(state: CrawlFormState): CrawlFormState {
  if (!state.autoAuth.config) {
    if (state.authMode === "auto") {
      return {
        ...state,
        authMode: "none",
      };
    }

    return state;
  }

  const hasPassword = state.autoAuth.credentials.password.trim().length > 0;
  if (hasPassword) {
    if (state.authMode === "auto") {
      return state;
    }

    return {
      ...state,
      authMode: "auto",
    };
  }

  if (state.authMode !== "auto") {
    return state;
  }

  return {
    ...state,
    authMode: "none",
  };
}
