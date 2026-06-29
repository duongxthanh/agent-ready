import type { CheckResult, CategoryReport, CategoryId } from './types.js';
import { CATEGORY_LABELS } from './rubric.js';

export function aggregate(checks: CheckResult[]): {
  categories: CategoryReport[];
  total: number;
  summary: { passes: number; warns: number; fails: number };
} {
  const ids = Object.keys(CATEGORY_LABELS) as CategoryId[];
  const categories: CategoryReport[] = ids
    .map((id) => {
      const own = checks.filter((c) => c.category === id);
      return {
        id,
        label: CATEGORY_LABELS[id],
        score: own.reduce((s, c) => s + c.score, 0),
        max: own.reduce((s, c) => s + c.max, 0),
        checks: own,
      };
    })
    .filter((c) => c.checks.length > 0);

  const total = categories.reduce((s, c) => s + c.score, 0);
  const summary = {
    passes: checks.filter((c) => c.status === 'pass').length,
    warns: checks.filter((c) => c.status === 'warn').length,
    fails: checks.filter((c) => c.status === 'fail').length,
  };
  return { categories, total, summary };
}
