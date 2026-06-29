import type { CategoryId, Grade } from './types.js';

export const RUBRIC_VERSION = 2;

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  access: 'Access',
  permission: 'Permission',
  readability: 'Readability',
  understandability: 'Understandability',
  discoverability: 'Discoverability',
};

// Per-check max points. Tier total = sum of its checks. Grand total = 100.
export const WEIGHTS = {
  access: { httpOk: 8, notBlocked: 7 }, // 15
  permission: { robotsExists: 5, aiBotsAllowed: 7, contentSignals: 3 }, // 15
  readability: { hasText: 16, notSpaShell: 11, hasHeadings: 4, semantic: 4 }, // 35
  understandability: { jsonLd: 9, title: 4, metaDescription: 4, openGraph: 2, lang: 3, canonical: 3 }, // 25
  discoverability: { sitemap: 4, llmsTxt: 3, linkHeaders: 2, markdown: 1 }, // 10
} as const;

export function gradeFor(score: number): Grade {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}
