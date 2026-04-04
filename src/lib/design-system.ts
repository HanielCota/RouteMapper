export const methodColorVariants = {
  GET: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/25',
  POST: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25',
  PUT: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/25',
  PATCH: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/25',
  DELETE: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25',
  default: 'bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/25',
} as const;

export const assetTypeVariants = {
  js: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/25',
  css: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25',
  image: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/25',
  font: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25',
  other: 'bg-muted text-muted-foreground border-border',
} as const;
