import { ALLOWED_HOSTS_MODE } from "@/features/crawl/domain/crawl-config";
import {
  HostScopePolicy,
  normalizeUrl,
  routePatternFromPath,
} from "@/features/crawl/domain/url-policy";

describe("url-policy", () => {
  it("normalizes hashes, trailing slashes and query ordering", () => {
    expect(
      normalizeUrl("https://example.com/path/?b=2&a=1#section"),
    ).toBe("https://example.com/path?a=1&b=2");
  });

  it("supports same-origin and related-host policies", () => {
    const sameOriginPolicy = new HostScopePolicy(
      "https://app.example.com",
      ALLOWED_HOSTS_MODE.SAME_ORIGIN,
    );
    const relatedHostPolicy = new HostScopePolicy(
      "https://app.example.com",
      ALLOWED_HOSTS_MODE.RELATED,
    );

    expect(sameOriginPolicy.allows("https://app.example.com/dashboard")).toBe(true);
    expect(sameOriginPolicy.allows("https://api.example.com/users")).toBe(false);
    expect(relatedHostPolicy.allows("https://api.example.com/users")).toBe(true);
    expect(relatedHostPolicy.allows("https://outside.test/users")).toBe(false);
  });

  it("treats IP addresses as exact hostnames in related-host mode", () => {
    const policy = new HostScopePolicy(
      "http://192.168.1.1:3000",
      ALLOWED_HOSTS_MODE.RELATED,
    );

    expect(policy.allows("http://192.168.1.1:3000/api")).toBe(true);
    expect(policy.allows("http://192.168.1.1:8080/api")).toBe(true);
    expect(policy.allows("http://10.0.0.1:3000/api")).toBe(false);
  });

  it("treats localhost as an exact hostname in related-host mode", () => {
    const policy = new HostScopePolicy(
      "http://localhost:3000",
      ALLOWED_HOSTS_MODE.RELATED,
    );

    expect(policy.allows("http://localhost:8080/api")).toBe(true);
    expect(policy.allows("http://example.com/api")).toBe(false);
  });

  it("converts dynamic-looking segments into stable route patterns", () => {
    expect(
      routePatternFromPath("/users/123/orders/550e8400-e29b-41d4-a716-446655440000"),
    ).toBe("/users/:number/orders/:uuid");
    expect(routePatternFromPath("/tokens/abcDEF1234567890fedc")).toBe(
      "/tokens/:id",
    );
  });
});
