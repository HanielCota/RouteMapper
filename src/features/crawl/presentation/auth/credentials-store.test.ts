// @vitest-environment jsdom

import {
  extractCredentialDomain,
  getSavedCredential,
  removeSavedCredential,
  saveCredential,
} from "@/features/crawl/presentation/auth/credentials-store";

function createMemoryStorage() {
  const storage = new Map<string, string>();

  return {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
    clear: () => {
      storage.clear();
    },
  };
}

describe("credentials-store", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });

    window.localStorage.clear();
  });

  it("saves, reads and removes credentials for a domain", () => {
    saveCredential("example.com", "user@example.com");

    expect(getSavedCredential("example.com")).toMatchObject({
      domain: "example.com",
      email: "user@example.com",
    });

    removeSavedCredential("example.com");
    expect(getSavedCredential("example.com")).toBeNull();
  });

  it("extracts the hostname when a full url is provided", () => {
    expect(extractCredentialDomain("https://app.example.com/login")).toBe(
      "app.example.com",
    );
  });
});
