"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AUTH_DEFAULTS, AUTH_STRATEGY } from "@/features/crawl/domain/crawl-config";
import { useCrawlMessagesContext } from "@/features/crawl/presentation/crawl-messages-context";
import { FormField } from "@/features/crawl/presentation/form/form-field";
import type { AuthStrategy } from "@/features/crawl/domain/crawl-config";
import type {
  ManualBearerDraft,
  ManualFormAuthDraft,
  ManualStorageStateDraft,
} from "@/features/crawl/presentation/form/crawl-form-state";

interface AuthConfigSectionProps {
  strategy: AuthStrategy;
  formValues: ManualFormAuthDraft;
  storageValues: ManualStorageStateDraft;
  bearerValues: ManualBearerDraft;
  errors: Record<string, string | undefined>;
  onStrategyChange: (strategy: AuthStrategy) => void;
  onFormValueChange: (field: keyof ManualFormAuthDraft, value: string) => void;
  onStorageStateChange: (storageState: string) => void;
  onBearerValueChange: (field: keyof ManualBearerDraft, value: string) => void;
}

export function AuthConfigSection({
  strategy,
  formValues,
  storageValues,
  bearerValues,
  errors,
  onStrategyChange,
  onFormValueChange,
  onStorageStateChange,
  onBearerValueChange,
}: AuthConfigSectionProps): React.JSX.Element {
  const [isSelectorsOpen, setIsSelectorsOpen] = useState(false);
  const crawlMessages = useCrawlMessagesContext();
  const messages = crawlMessages.manualAuth;

  return (
    <div className="space-y-4 pt-2">
      <FormField label={messages.strategyLabel}>
        <Select
          value={strategy}
          onValueChange={(value) => {
            if (!value) {
              return;
            }

            onStrategyChange(value as AuthStrategy);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={AUTH_STRATEGY.FORM}>
              {messages.formLogin}
            </SelectItem>
            <SelectItem value={AUTH_STRATEGY.STORAGE_STATE}>
              {messages.storageState}
            </SelectItem>
            <SelectItem value={AUTH_STRATEGY.BEARER}>
              {messages.bearerToken}
            </SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      {strategy === AUTH_STRATEGY.FORM ? (
        <div className="space-y-4">
          <fieldset className="space-y-3 rounded-lg border border-border/50 p-4">
            <legend className="px-1 text-sm font-medium text-muted-foreground">
              {messages.credentials}
            </legend>

            <FormField
              label={messages.loginUrl}
              required
              error={errors.loginUrl}
            >
              <Input
                type="url"
                placeholder="https://exemplo.com/login"
                value={formValues.loginUrl}
                onChange={(event) =>
                  onFormValueChange("loginUrl", event.target.value)
                }
                autoComplete="url"
              />
            </FormField>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                label={messages.username}
                description={messages.usernameOptionalHint}
                error={errors.username}
              >
                <Input
                  type="text"
                  placeholder="usuario@exemplo.com"
                  value={formValues.username}
                  onChange={(event) =>
                    onFormValueChange("username", event.target.value)
                  }
                  autoComplete="username"
                />
              </FormField>
              <FormField
                label={messages.password}
                required
                error={errors.password}
              >
                <Input
                  type="password"
                  value={formValues.password}
                  onChange={(event) =>
                    onFormValueChange("password", event.target.value)
                  }
                  autoComplete="current-password"
                />
              </FormField>
            </div>
          </fieldset>

          <Separator />

          <Collapsible open={isSelectorsOpen} onOpenChange={setIsSelectorsOpen}>
            <CollapsibleTrigger className="flex cursor-pointer items-center gap-2 rounded text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              {isSelectorsOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              {messages.cssSelectors}
              <span className="text-xs font-normal text-muted-foreground">
                {messages.optional}
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <FormField label={messages.usernameSelector}>
                  <Input
                    placeholder={AUTH_DEFAULTS.login.usernameSelector}
                    value={formValues.usernameSelector}
                    onChange={(event) =>
                      onFormValueChange("usernameSelector", event.target.value)
                    }
                    className="font-mono text-xs"
                  />
                </FormField>
                <FormField label={messages.passwordSelector}>
                  <Input
                    placeholder={AUTH_DEFAULTS.login.passwordSelector}
                    value={formValues.passwordSelector}
                    onChange={(event) =>
                      onFormValueChange("passwordSelector", event.target.value)
                    }
                    className="font-mono text-xs"
                  />
                </FormField>
                <FormField label={messages.submitSelector}>
                  <Input
                    placeholder={AUTH_DEFAULTS.login.submitSelector}
                    value={formValues.submitSelector}
                    onChange={(event) =>
                      onFormValueChange("submitSelector", event.target.value)
                    }
                    className="font-mono text-xs"
                  />
                </FormField>
              </div>

              <FormField label={messages.rememberMeSelector}>
                <Input
                  placeholder='input[type="checkbox"]'
                  value={formValues.rememberMeSelector}
                  onChange={(event) =>
                    onFormValueChange("rememberMeSelector", event.target.value)
                  }
                  className="font-mono text-xs"
                />
              </FormField>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label={messages.successUrlContains}>
                  <Input
                    placeholder="/dashboard"
                    value={formValues.successUrl}
                    onChange={(event) =>
                      onFormValueChange("successUrl", event.target.value)
                    }
                  />
                </FormField>
                <FormField label={messages.successSelector}>
                  <Input
                    placeholder=".dashboard-header"
                    value={formValues.successSelector}
                    onChange={(event) =>
                      onFormValueChange("successSelector", event.target.value)
                    }
                    className="font-mono text-xs"
                  />
                </FormField>
              </div>

              <FormField label={messages.postSubmitTimeout}>
                <Input
                  type="number"
                  min={1000}
                  value={formValues.postSubmitTimeoutMs}
                  onChange={(event) =>
                    onFormValueChange("postSubmitTimeoutMs", event.target.value)
                  }
                />
              </FormField>
            </CollapsibleContent>
          </Collapsible>
        </div>
      ) : null}

      {strategy === AUTH_STRATEGY.STORAGE_STATE ? (
        <FormField
          label={messages.storageStateLabel}
          required
          error={errors.storageState}
        >
          <Textarea
            placeholder={messages.storageStatePlaceholder}
            value={storageValues.storageState}
            onChange={(event) => onStorageStateChange(event.target.value)}
            rows={8}
            className="font-mono text-xs"
          />
        </FormField>
      ) : null}

      {strategy === AUTH_STRATEGY.BEARER ? (
        <div className="space-y-3">
          <FormField
            label={messages.bearerTokenLabel}
            required
            error={errors.token}
          >
            <Input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIs..."
              value={bearerValues.token}
              onChange={(event) =>
                onBearerValueChange("token", event.target.value)
              }
              className="font-mono text-xs"
              autoComplete="off"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label={messages.bearerHeaderName}>
              <Input
                placeholder="Authorization"
                value={bearerValues.headerName}
                onChange={(event) =>
                  onBearerValueChange("headerName", event.target.value)
                }
                className="font-mono text-xs"
              />
            </FormField>
            <FormField label={messages.bearerHeaderPrefix}>
              <Input
                placeholder="Bearer"
                value={bearerValues.headerPrefix}
                onChange={(event) =>
                  onBearerValueChange("headerPrefix", event.target.value)
                }
                className="font-mono text-xs"
              />
            </FormField>
          </div>

          <p className="text-xs text-muted-foreground">
            {messages.bearerPreview}: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{bearerValues.headerName}: {bearerValues.headerPrefix ? `${bearerValues.headerPrefix} ` : ""}{bearerValues.token ? "••••••" : "..."}</code>
          </p>
        </div>
      ) : null}
    </div>
  );
}
