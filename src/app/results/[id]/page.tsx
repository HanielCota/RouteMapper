import type { Metadata } from "next";
import { ResultsPageClient } from "@/features/crawl/presentation/results/results-page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Scan ${id.slice(0, 8)}`,
    description: `View crawl results for job ${id}`,
  };
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ResultsPageClient key={id} jobId={id} />;
}
