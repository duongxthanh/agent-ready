import type { StackProfile } from './detect.js';
export type { StackProfile };

export type CheckStatus = 'pass' | 'warn' | 'fail';
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export type CategoryId =
  | 'access'
  | 'permission'
  | 'readability'
  | 'understandability'
  | 'discoverability';

export interface CheckResult {
  id: string;
  category: CategoryId;
  score: number; // points earned (0..max)
  max: number;   // max points for this check
  status: CheckStatus;
  message: string; // what was found
  fix: string;     // how to fix ('' when pass)
  evidence?: string;
}

export interface FetchResult {
  target: string;
  mode: 'url' | 'folder';
  fetchedAs: string;
  status: number;  // 0 when folder or unreachable
  ok: boolean;
  headers: Record<string, string>;
  html: string;
  robotsTxt: string | null;
  sitemapXml: string | null;
  llmsTxt: string | null;
  markdownContentType: string | null; // content-type when homepage is requested with Accept: text/markdown
  timingMs: number;
  error?: string;
}

export interface CheckContext {
  fetch: FetchResult;
}

export interface CategoryReport {
  id: CategoryId;
  label: string;
  score: number;
  max: number;
  checks: CheckResult[];
}

export interface Report {
  target: string;
  mode: 'url' | 'folder';
  fetchedAs: string;
  rubricVersion: number;
  stack: StackProfile;
  score: number;
  grade: Grade;
  categories: CategoryReport[];
  summary: { passes: number; warns: number; fails: number };
  generatedAt: string;
}
