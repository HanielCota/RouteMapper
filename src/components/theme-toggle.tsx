"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useThemeMessages } from "@/shared/i18n/use-messages";

function subscribeToHydrationStatus(): () => void {
  return () => undefined;
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const themeMessages = useThemeMessages();
  const mounted = useSyncExternalStore(
    subscribeToHydrationStatus,
    () => true,
    () => false,
  );

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={mounted ? (isDark ? themeMessages.switchToLight : themeMessages.switchToDark) : themeMessages.switchToDark}
      className="rounded-md"
    >
      {mounted ? (
        isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
