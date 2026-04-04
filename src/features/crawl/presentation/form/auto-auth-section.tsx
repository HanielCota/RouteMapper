"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, Lock, RefreshCw, Save, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCrawlMessagesContext } from "@/features/crawl/presentation/crawl-messages-context";
import { FormField } from "@/features/crawl/presentation/form/form-field";
import type { DetectedLoginConfig } from "@/features/crawl/domain/crawl-config";
import type { AutoAuthCredentials } from "@/features/crawl/presentation/form/crawl-form-state";

interface AutoAuthSectionProps {
  enabled: boolean;
  isActivated: boolean;
  detectedConfig: DetectedLoginConfig | null;
  credentials: AutoAuthCredentials;
  saveCredentials: boolean;
  isLoading?: boolean;
  isDetecting: boolean;
  detectionError: string | null;
  onToggle: (enabled: boolean) => void;
  onDetect: () => Promise<void>;
  onCredentialsChange: (
    field: keyof AutoAuthCredentials,
    value: string | boolean,
  ) => void;
  onSaveCredentialsChange: (saveCredentials: boolean) => void;
  onEnable: () => void;
}

export function AutoAuthSection({
  enabled,
  isActivated,
  detectedConfig,
  credentials,
  saveCredentials,
  isLoading,
  isDetecting,
  detectionError,
  onToggle,
  onDetect,
  onCredentialsChange,
  onSaveCredentialsChange,
  onEnable,
}: AutoAuthSectionProps): React.JSX.Element {
  const crawlMessages = useCrawlMessagesContext();
  const messages = crawlMessages.autoAuth;
  const [isExpandedAfterReady, setIsExpandedAfterReady] = useState(false);
  const isPasswordOnly = detectedConfig?.isPasswordOnly ?? false;
  const isFormComplete = credentials.password.length > 0;
  const isDetailsOpen = !isActivated || isExpandedAfterReady;
  const steps = [
    {
      label: messages.stepDetect,
      done: Boolean(detectedConfig),
    },
    {
      label: messages.stepPassword,
      done: isFormComplete,
    },
    {
      label: messages.stepReady,
      done: isActivated,
    },
  ];

  const handleEnable = (): void => {
    if (!detectedConfig) {
      toast.error(messages.toastDetectFirst);
      return;
    }

    if (!credentials.password) {
      toast.error(messages.toastFillPassword);
      return;
    }

    onEnable();
    toast.success(messages.toastEnabled);
  };

  const handleToggle = (checked: boolean): void => {
    if (checked) {
      onToggle(true);
      return;
    }

    onToggle(false);
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-start gap-3">
        <Switch checked={enabled} onCheckedChange={handleToggle} id="auto-auth-toggle" />
        <div className="flex-1 space-y-1">
          <Label htmlFor="auto-auth-toggle" className="flex cursor-pointer items-center gap-2">
            <Lock className="h-4 w-4" />
            {messages.label}
          </Label>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {messages.description}
          </p>
        </div>
      </div>

      {enabled ? (
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-b from-primary/5 via-background to-background shadow-sm">
          <Collapsible
            open={isDetailsOpen}
            onOpenChange={(open) => setIsExpandedAfterReady(open)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">{messages.setupTitle}</CardTitle>
                <div className="flex items-center gap-2">
                  {!detectedConfig ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void onDetect()}
                      disabled={isDetecting || isLoading}
                      className="h-7 gap-1.5"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${isDetecting ? "animate-spin" : ""}`}
                      />
                      {isDetecting ? messages.detecting : messages.detectForm}
                    </Button>
                  ) : null}
                  {detectedConfig ? (
                    <CollapsibleTrigger className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/80 px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                      {isDetailsOpen ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                      {isDetailsOpen ? "Recolher" : "Abrir"}
                    </CollapsibleTrigger>
                  ) : null}
                </div>
              </div>
            </CardHeader>

            {!isDetailsOpen && isActivated ? (
              <CardContent className="pt-0">
                <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-medium">{messages.enableAuth}</p>
                      <p className="mt-1 text-xs opacity-90">{messages.readyMessage}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            ) : null}

            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                  <p className="mb-3 text-sm font-medium text-foreground">
                    {messages.stepsTitle}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {steps.map((step) => (
                      <div
                        key={step.label}
                        className={`rounded-lg border px-3 py-2 text-sm ${
                          step.done
                            ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
                            : "border-border/60 bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {step.done ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                          ) : (
                            <div className="h-4 w-4 shrink-0 rounded-full border border-current/40" />
                          )}
                          <span>{step.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {isDetecting ? (
                  <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    {messages.analyzingPage}
                  </div>
                ) : null}

                {detectionError ? (
                  <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{detectionError}</p>
                  </div>
                ) : null}

                {detectedConfig ? (
                  <>
                    <div className="flex items-start gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="font-medium">{messages.formDetected}</p>
                        <p className="mt-0.5 text-xs opacity-80">
                          {isPasswordOnly
                            ? messages.formDetectedDescPasswordOnly
                            : messages.formDetectedDescFull}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {!isPasswordOnly ? (
                        <FormField label={messages.username} htmlFor="auto-username">
                          <Input
                            id="auto-username"
                            type="text"
                            placeholder="seu@email.com"
                            value={credentials.username}
                            onChange={(event) =>
                              onCredentialsChange("username", event.target.value)
                            }
                            autoComplete="username"
                          />
                        </FormField>
                      ) : null}

                      <FormField label={messages.password} htmlFor="auto-password">
                        <div className="space-y-2">
                          <Input
                            id="auto-password"
                            type="password"
                            placeholder="••••••••"
                            value={credentials.password}
                            onChange={(event) =>
                              onCredentialsChange("password", event.target.value)
                            }
                            autoComplete="current-password"
                          />
                          <p className="text-xs text-muted-foreground">
                            {messages.passwordHelp}
                          </p>
                        </div>
                      </FormField>

                      {!isPasswordOnly ? (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={saveCredentials}
                            onCheckedChange={onSaveCredentialsChange}
                            id="save-creds"
                          />
                          <Label htmlFor="save-creds" className="cursor-pointer text-sm">
                            <Save className="mr-1.5 inline h-3.5 w-3.5" />
                            {messages.saveCredentials}
                          </Label>
                        </div>
                      ) : null}

                      {isActivated ? (
                        <div className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
                          <p className="font-medium">{messages.enableAuth}</p>
                          <p className="mt-1 text-xs opacity-90">{messages.readyMessage}</p>
                        </div>
                      ) : (
                        <Button
                          onClick={handleEnable}
                          disabled={!isFormComplete}
                          className="w-full"
                        >
                          <Lock className="mr-2 h-4 w-4" />
                          {messages.enableAuth}
                        </Button>
                      )}
                    </div>
                  </>
                ) : null}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ) : null}
    </div>
  );
}
