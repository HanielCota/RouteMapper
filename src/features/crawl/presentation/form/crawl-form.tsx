"use client";

import { ChevronDown, ChevronRight, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  ALLOWED_HOSTS_MODE,
} from "@/features/crawl/domain/crawl-config";
import { useCrawlMessagesContext } from "@/features/crawl/presentation/crawl-messages-context";
import { AuthConfigSection } from "@/features/crawl/presentation/form/auth-config-section";
import { AutoAuthSection } from "@/features/crawl/presentation/form/auto-auth-section";
import { FormField } from "@/features/crawl/presentation/form/form-field";
import { useCrawlFormController } from "@/features/crawl/presentation/form/use-crawl-form-controller";
import type { AllowedHostsMode } from "@/features/crawl/domain/crawl-config";

export function CrawlForm(): React.JSX.Element {
  const {
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
  } = useCrawlFormController();
  const crawlMessages = useCrawlMessagesContext();
  const messages = crawlMessages.form;

  const handleAutoAuthToggle = (enabled: boolean): void => {
    if (enabled) {
      void detectAutoAuth();
      return;
    }

    disableAutoAuth();
  };

  const isManualAuthVisible = state.authMode === "manual";
  const isSubmitDisabled = isSubmitting || submissionBlocker !== null;

  return (
    <Card className="w-full max-w-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">{messages.cardTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event) => void submit(event)} className="space-y-6">
          <FormField
            label={messages.urlLabel}
            required
            htmlFor="url"
            error={state.errors.url}
          >
            <Input
              id="url"
              type="url"
              placeholder={messages.urlPlaceholder}
              value={state.url}
              onChange={(event) => setField("url", event.target.value)}
              required
              autoComplete="url"
            />
          </FormField>

          <Collapsible
            open={state.isAdvancedOpen}
            onOpenChange={(isAdvancedOpen) => setField("isAdvancedOpen", isAdvancedOpen)}
          >
            <CollapsibleTrigger className="flex cursor-pointer items-center gap-2 rounded text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              {state.isAdvancedOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              {messages.advancedSettings}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label={messages.maxPages}
                  description={messages.maxPagesDesc}
                  error={state.errors.maxPages}
                >
                  <Input
                    type="number"
                    min={1}
                    value={state.maxPages}
                    onChange={(event) => setField("maxPages", event.target.value)}
                  />
                </FormField>
                <FormField
                  label={messages.maxClicksPerPage}
                  description={messages.maxClicksPerPageDesc}
                >
                  <Input
                    type="number"
                    min={0}
                    value={state.maxClicksPerPage}
                    onChange={(event) =>
                      setField("maxClicksPerPage", event.target.value)
                    }
                  />
                </FormField>
                <FormField
                  label={messages.navigationTimeout}
                  description={messages.navigationTimeoutDesc}
                >
                  <Input
                    type="number"
                    min={5000}
                    value={state.timeoutMs}
                    onChange={(event) => setField("timeoutMs", event.target.value)}
                  />
                </FormField>
                <FormField
                  label={messages.navIdleTimeout}
                  description={messages.navIdleTimeoutDesc}
                >
                  <Input
                    type="number"
                    min={1000}
                    value={state.navigationIdleTimeoutMs}
                    onChange={(event) =>
                      setField("navigationIdleTimeoutMs", event.target.value)
                    }
                  />
                </FormField>
                <FormField
                  label={messages.interactionIdleTimeout}
                  description={messages.interactionIdleTimeoutDesc}
                >
                  <Input
                    type="number"
                    min={500}
                    value={state.interactionIdleTimeoutMs}
                    onChange={(event) =>
                      setField("interactionIdleTimeoutMs", event.target.value)
                    }
                  />
                </FormField>
                <FormField
                  label={messages.allowedHostsMode}
                  description={messages.allowedHostsModeDesc}
                >
                  <Select
                    value={state.allowedHostsMode}
                    onValueChange={(value) =>
                      value ? setAllowedHostsMode(value as AllowedHostsMode) : undefined
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALLOWED_HOSTS_MODE.RELATED}>
                        {messages.relatedHosts}
                      </SelectItem>
                      <SelectItem value={ALLOWED_HOSTS_MODE.SAME_ORIGIN}>
                        {messages.sameOrigin}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="space-y-4">
            <AutoAuthSection
              enabled={isAutoAuthVisible}
              isActivated={state.authMode === "auto"}
              detectedConfig={state.autoAuth.config}
              credentials={state.autoAuth.credentials}
              saveCredentials={state.autoAuth.saveCredentials}
              isLoading={isSubmitting}
              isDetecting={isDetectingAuth}
              detectionError={authDetectionError}
              onToggle={handleAutoAuthToggle}
              onDetect={detectAutoAuth}
              onCredentialsChange={setAutoAuthCredentials}
              onSaveCredentialsChange={setSaveCredentials}
              onEnable={() => setAuthMode("auto")}
            />

            <Separator />

            <div className="flex items-start gap-3">
              <Switch
                checked={isManualAuthVisible}
                onCheckedChange={(checked) => {
                  if (checked) {
                    disableAutoAuth();
                    setAuthMode("manual");
                    return;
                  }

                  setAuthMode("none");
                }}
                id="auth-toggle"
                aria-describedby="auth-toggle-desc"
              />
              <div className="flex-1 space-y-1">
                <Label htmlFor="auth-toggle" className="cursor-pointer">
                  {messages.manualAuth}
                </Label>
                <p
                  id="auth-toggle-desc"
                  className="text-xs leading-relaxed text-muted-foreground"
                >
                  {messages.manualAuthDesc}
                </p>
              </div>
            </div>

            {isManualAuthVisible ? (
              <AuthConfigSection
                strategy={state.manualAuthStrategy}
                formValues={state.manualFormAuth}
                storageValues={state.manualStorageState}
                bearerValues={state.manualBearer}
                onStrategyChange={(strategy) => setManualAuthStrategy(strategy)}
                onFormValueChange={setManualFormAuthField}
                onStorageStateChange={setManualStorageState}
                onBearerValueChange={setManualBearerField}
                errors={state.errors}
              />
            ) : null}
          </div>

          <div className="space-y-2 pt-2">
            <Button
              type="submit"
              className="h-11 w-full text-base"
              size="xl"
              disabled={isSubmitDisabled}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {messages.startingScan}
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  {messages.startScan}
                </>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {messages.estimatedTime(state.maxPages)}
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
