import { describe, it, expect } from 'vitest';
import { aggregate } from '../src/score.js';
import type { CheckResult } from '../src/types.js';

const c = (category: CheckResult['category'], score: number, max: number, status: CheckResult['status'] = 'pass'): CheckResult =>
  ({ id: `${category}-x`, category, score, max, status, message: '', fix: '' });

describe('aggregate', () => {
  it('sums per tier and overall', () => {
    const { categories, total } = aggregate([c('access', 15, 15), c('readability', 20, 35, 'warn')]);
    expect(total).toBe(35);
    expect(categories.find((x) => x.id === 'access')?.score).toBe(15);
  });

  it('orders tiers by the rubric order', () => {
    const { categories } = aggregate([c('discoverability', 1, 10), c('access', 1, 15)]);
    expect(categories[0].id).toBe('access');
  });
});
