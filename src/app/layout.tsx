import type { Metadata } from "next";
import Link from "next/link";
import { Globe } from "lucide-react";
import { Geist, Geist_Mono } from "next/font/google";
import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/sonner";
import { CrawlMessagesProvider } from "@/features/crawl/presentation/crawl-messages-context";
import { LocaleProvider } from "@/shared/i18n/locale-context";
import { appMessages } from "@/shared/messages/app-messages";
import "./globals.css";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: appMessages.title,
    template: `%s | ${appMessages.title}`,
  },
  description: appMessages.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <ThemeProvider>
          <LocaleProvider>
          <CrawlMessagesProvider>
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-14 items-center px-4">
                <Link
                  href="/"
                  className="flex items-center gap-2 font-semibold tracking-tight text-foreground hover:text-primary transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-md"
                >
                  <Globe className="h-5 w-5 text-primary" aria-hidden />
                  <span className="hidden sm:inline">{appMessages.brandFull}</span>
                  <span className="sm:hidden">{appMessages.brandShort}</span>
                </Link>
                <div className="ml-auto flex items-center gap-1">
                  <LocaleToggle />
                  <ThemeToggle />
                </div>
              </div>
            </header>
            <div className="flex-1">
              {children}
            </div>
            <Toaster />
          </CrawlMessagesProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
