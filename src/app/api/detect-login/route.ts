import { NextResponse } from "next/server";
import { detectLoginInputSchema } from "@/features/crawl/domain/crawl-config";
import { LoginFormNotFoundError } from "@/features/crawl/infrastructure/playwright/playwright-login-detector";
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
    const parsedInput = detectLoginInputSchema.safeParse(body);
    if (!parsedInput.success) {
      return NextResponse.json(
        { error: apiErrorMessages.invalidUrl, details: parsedInput.error.flatten() },
        { status: 400 },
      );
    }

    const detectedLogin = await getCrawlService().detectLogin(parsedInput.data.url);
    return NextResponse.json(detectedLogin);
  } catch (error: unknown) {
    if (error instanceof LoginFormNotFoundError) {
      return NextResponse.json({ error: apiErrorMessages.noLoginForm }, { status: 404 });
    }

    const message = error instanceof Error ? error.message : apiErrorMessages.detectionFailed;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
