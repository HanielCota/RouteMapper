/** @vitest-environment jsdom */

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCrawlStream } from "@/features/crawl/presentation/results/use-crawl-stream";

class FakeEventSource {
  static instances: FakeEventSource[] = [];

  readonly close = vi.fn();
  readonly url: string;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onopen: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }
}

function HookProbe(): React.JSX.Element {
  const stream = useCrawlStream("job-123");
  return <div data-state={stream.isConnected ? "connected" : "disconnected"} />;
}

describe("useCrawlStream", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    FakeEventSource.instances = [];
    vi.stubGlobal("EventSource", FakeEventSource);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it("keeps the EventSource alive across transient errors so the browser can reconnect", async () => {
    await act(async () => {
      root.render(<HookProbe />);
    });

    const source = FakeEventSource.instances[0];
    expect(source).toBeDefined();

    await act(async () => {
      source.onopen?.(new Event("open"));
    });
    expect(container.firstElementChild?.getAttribute("data-state")).toBe("connected");

    await act(async () => {
      source.onerror?.(new Event("error"));
    });
    expect(source.close).not.toHaveBeenCalled();
    expect(container.firstElementChild?.getAttribute("data-state")).toBe("disconnected");

    await act(async () => {
      source.onopen?.(new Event("open"));
    });
    expect(container.firstElementChild?.getAttribute("data-state")).toBe("connected");
  });
});
