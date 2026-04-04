"use client";

export type AssetType = "js" | "css" | "image" | "font" | "other";

export function classifyAssetUrl(url: string): AssetType {
  const path = url.toLowerCase().split("?")[0];
  if (/\.(js|mjs|jsx|ts|tsx)$/.test(path)) {
    return "js";
  }

  if (/\.(css|scss|sass|less)$/.test(path)) {
    return "css";
  }

  if (/\.(png|jpe?g|gif|svg|webp|avif|ico|bmp)$/.test(path)) {
    return "image";
  }

  if (/\.(woff2?|ttf|otf|eot)$/.test(path)) {
    return "font";
  }

  return "other";
}
