import { SSE_EVENT_TYPE } from "@/features/crawl/domain/crawl-config";
import { isTerminalStatus } from "@/features/crawl/domain/crawl-job";
import { getCrawlService } from "@/features/crawl/infrastructure/server-runtime";
import { apiErrorMessages } from "@/shared/messages/api-error-messages";
import type { CrawlEvent } from "@/features/crawl/domain/crawl-event";

export const dynamic = "force-dynamic";

const sseHeaders = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
} as const;

export async function GET(
  _request: Request,
  context: RouteContext<"/api/crawl/[id]/stream">,
): Promise<Response> {
  const { id } = await context.params;
  const crawlService = getCrawlService();
  const crawl = await crawlService.getCrawl(id);
  if (!crawl) {
    return new Response(null, { status: 404 });
  }

  const encoder = new TextEncoder();
  let closed = false;
  let unsubscribe: (() => void) | null = null;

  const closeStream = (): void => {
    closed = true;
    unsubscribe?.();
    unsubscribe = null;
  };

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: CrawlEvent): void => {
        if (closed) {
          return;
        }

        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          closeStream();
          return;
        }

        if (event.type !== SSE_EVENT_TYPE.DONE) {
          return;
        }

        closeStream();
        controller.close();
      };

      if (isTerminalStatus(crawl.status)) {
        send({ type: SSE_EVENT_TYPE.DONE, data: { status: crawl.status } });
        return;
      }

      send({ type: SSE_EVENT_TYPE.PROGRESS, data: crawl.progress });

      unsubscribe = await crawlService.subscribeToCrawl(id, send);
      if (unsubscribe) {
        return;
      }

      send({
        type: SSE_EVENT_TYPE.ERROR,
        data: { message: apiErrorMessages.jobUnavailable },
      });
      send({
        type: SSE_EVENT_TYPE.DONE,
        data: { status: crawl.status },
      });
    },
    cancel() {
      closeStream();
    },
  });

  return new Response(stream, { headers: sseHeaders });
}
