"use client";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/shared/i18n/locale-context";
import { LOCALE } from "@/shared/i18n/locales";

export function LocaleToggle() {
  const { locale, toggleLocale } = useLocale();
  const label = locale === LOCALE.PT ? "Switch to English" : "Mudar para Português";
  const flag = locale === LOCALE.PT ? "EN" : "PT";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      aria-label={label}
      className="rounded-md gap-1 px-2 font-mono text-xs font-semibold"
    >
      {flag}
    </Button>
  );
}
