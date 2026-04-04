"use client";

import { useState } from "react";
import { Cookie, Copy, Database, Eye, EyeOff, Key, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CREDENTIAL_TYPE } from "@/features/crawl/domain/crawl-config";
import { useCrawlMessagesContext } from "@/features/crawl/presentation/crawl-messages-context";
import { useLocale } from "@/shared/i18n/locale-context";
import type { CapturedCredential, CredentialType } from "@/features/crawl/domain/crawl-config";

interface CapturedTokensCardProps {
  tokens: CapturedCredential[];
}

function maskValue(value: string): string {
  if (value.length <= 12) return "••••••••";
  return value.slice(0, 8) + "••••••••" + value.slice(-4);
}

const typeConfig: Record<CredentialType, {
  icon: typeof Key;
  badgeVariant: "default" | "secondary" | "outline" | "success" | "warning";
}> = {
  [CREDENTIAL_TYPE.HEADER]: { icon: ShieldCheck, badgeVariant: "default" },
  [CREDENTIAL_TYPE.COOKIE]: { icon: Cookie, badgeVariant: "warning" },
  [CREDENTIAL_TYPE.LOCAL_STORAGE]: { icon: Database, badgeVariant: "secondary" },
  [CREDENTIAL_TYPE.SESSION_STORAGE]: { icon: Database, badgeVariant: "outline" },
};

const typeLabels: Record<CredentialType, { pt: string; en: string }> = {
  [CREDENTIAL_TYPE.HEADER]: { pt: "Header", en: "Header" },
  [CREDENTIAL_TYPE.COOKIE]: { pt: "Cookie", en: "Cookie" },
  [CREDENTIAL_TYPE.LOCAL_STORAGE]: { pt: "localStorage", en: "localStorage" },
  [CREDENTIAL_TYPE.SESSION_STORAGE]: { pt: "sessionStorage", en: "sessionStorage" },
};

export function CapturedTokensCard({ tokens }: CapturedTokensCardProps): React.JSX.Element | null {
  const [revealedIndexes, setRevealedIndexes] = useState<Set<number>>(new Set());
  const crawlMessages = useCrawlMessagesContext();
  const { locale } = useLocale();
  const messages = crawlMessages.capturedTokens;

  if (tokens.length === 0) {
    return null;
  }

  const toggleReveal = (index: number) => {
    setRevealedIndexes((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }

      return next;
    });
  };

  const copyValue = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(messages.copied);
  };

  const grouped = {
    headers: tokens.filter((t) => t.type === CREDENTIAL_TYPE.HEADER),
    cookies: tokens.filter((t) => t.type === CREDENTIAL_TYPE.COOKIE),
    storage: tokens.filter(
      (t) => t.type === CREDENTIAL_TYPE.LOCAL_STORAGE || t.type === CREDENTIAL_TYPE.SESSION_STORAGE,
    ),
  };
  const summaryText = messages.summary(
    grouped.headers.length,
    grouped.cookies.length,
    grouped.storage.length,
  );

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Key className="h-4 w-4 text-primary" />
          {messages.title}
          <Badge variant="secondary" className="ml-auto text-xs">
            {tokens.length}
          </Badge>
        </CardTitle>
        <CardDescription>{messages.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {tokens.map((credential, index) => {
          const revealed = revealedIndexes.has(index);
          const config = typeConfig[credential.type];
          const Icon = config.icon;
          const label = typeLabels[credential.type];

          return (
            <div
              key={`${credential.type}-${credential.name}-${index}`}
              className="rounded-lg border bg-muted/30 p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <Badge variant={config.badgeVariant} className="text-xs">
                    {locale === "pt-BR" ? label.pt : label.en}
                  </Badge>
                  <span className="font-mono text-xs font-medium">{credential.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => toggleReveal(index)}
                    aria-label={revealed ? messages.hide : messages.reveal}
                  >
                    {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => void copyValue(credential.value)}
                    aria-label={messages.copy}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="break-all font-mono text-xs text-foreground/80">
                {revealed ? credential.value : maskValue(credential.value)}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {messages.firstSeen}: <span className="font-mono">{credential.source}</span>
              </p>
            </div>
          );
        })}

        {summaryText ? (
          <p className="pt-1 text-xs text-muted-foreground">
            {summaryText}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
