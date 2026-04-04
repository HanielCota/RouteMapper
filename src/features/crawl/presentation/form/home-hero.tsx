"use client";

import Image from "next/image";
import { useAppMessages } from "@/shared/i18n/use-messages";

export function HomeHero() {
  const messages = useAppMessages();

  return (
    <div className="text-center mb-8 max-w-lg space-y-4">
      <div className="flex justify-center">
        <Image
          src="/route-mapper-icon.svg"
          alt="Route Mapper"
          width={64}
          height={64}
          className="dark:invert-0"
          priority
        />
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
        {messages.title}
      </h1>
      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
        {messages.description}
      </p>
    </div>
  );
}
