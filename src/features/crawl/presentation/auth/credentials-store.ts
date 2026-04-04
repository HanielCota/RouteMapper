import "client-only";

import { z } from "zod";

const savedCredentialSchema = z.object({
  email: z.string(),
  domain: z.string(),
  savedAt: z.string(),
});

const credentialsArraySchema = z.array(savedCredentialSchema);

type SavedCredential = z.infer<typeof savedCredentialSchema>;

const STORAGE_KEY = "route_mapper_credentials";

function isClientSide(): boolean {
  return typeof window !== "undefined";
}

function readCredentials(): SavedCredential[] {
  if (!isClientSide()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsed = credentialsArraySchema.safeParse(JSON.parse(rawValue));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

function writeCredentials(credentials: SavedCredential[]): void {
  if (!isClientSide()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
  } catch {
    return;
  }
}

export function saveCredential(domain: string, email: string): void {
  const credentials = readCredentials();
  const nextCredential: SavedCredential = {
    email,
    domain,
    savedAt: new Date().toISOString(),
  };

  const currentIndex = credentials.findIndex((entry) => entry.domain === domain);
  if (currentIndex >= 0) {
    credentials[currentIndex] = nextCredential;
    writeCredentials(credentials);
    return;
  }

  credentials.push(nextCredential);
  writeCredentials(credentials);
}

export function getSavedCredential(domain: string): SavedCredential | null {
  return readCredentials().find((entry) => entry.domain === domain) ?? null;
}

export function removeSavedCredential(domain: string): void {
  writeCredentials(readCredentials().filter((entry) => entry.domain !== domain));
}

export function hasSavedCredential(domain: string): boolean {
  return getSavedCredential(domain) !== null;
}

export function extractCredentialDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
