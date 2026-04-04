import { CrawlForm } from "@/features/crawl/presentation/form/crawl-form";
import { HomeHero } from "@/features/crawl/presentation/form/home-hero";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:py-16">
      <HomeHero />
      <CrawlForm />
    </main>
  );
}
