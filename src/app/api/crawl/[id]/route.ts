import { NextResponse } from "next/server";
import { getCrawlService } from "@/features/crawl/infrastructure/server-runtime";
import { apiErrorMessages } from "@/shared/messages/api-error-messages";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/crawl/[id]">,
): Promise<NextResponse> {
  const { id } = await context.params;
  const crawl = await getCrawlService().getCrawl(id);
  if (!crawl) {
    return NextResponse.json({ error: apiErrorMessages.jobNotFound }, { status: 404 });
  }

  return NextResponse.json(crawl);
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/crawl/[id]">,
): Promise<NextResponse> {
  const { id } = await context.params;
  const cancelled = await getCrawlService().cancelCrawl(id);
  if (!cancelled) {
    return NextResponse.json(
      { error: apiErrorMessages.jobNotCancellable },
      { status: 404 },
    );
  }

  return NextResponse.json({ status: "cancelled" });
}
