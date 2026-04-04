import { NextResponse, after } from "next/server";
import { crawlInputSchema } from "@/features/crawl/domain/crawl-config";
import { getCrawlService } from "@/features/crawl/infrastructure/server-runtime";
import { getRateLimitHeaders, isRateLimited } from "@/lib/rate-limit";
import { apiErrorMessages } from "@/shared/messages/api-error-messages";

export async function POST(request: Request): Promise<NextResponse> {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: apiErrorMessages.rateLimited },
      { status: 429, headers: getRateLimitHeaders(ip) },
    );
  }

  try {
    const body = await request.json();
    const parsedInput = crawlInputSchema.safeParse(body);
    if (!parsedInput.success) {
      return NextResponse.json(
        { error: apiErrorMessages.validationFailed, details: parsedInput.error.flatten() },
        { status: 400 },
      );
    }

    const crawlService = getCrawlService();
    const jobId = await crawlService.startCrawl(parsedInput.data, {
      startInBackground: false,
    });
    after(() => crawlService.runCrawl(jobId));
    return NextResponse.json({ id: jobId }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : apiErrorMessages.unknownError;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
