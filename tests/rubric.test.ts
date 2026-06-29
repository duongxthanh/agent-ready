import { describe, it, expect } from 'vitest';
import { WEIGHTS, CATEGORY_LABELS, RUBRIC_VERSION, gradeFor } from '../src/rubric.js';

const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);

describe('rubric v2', () => {
  it('is version 2', () => expect(RUBRIC_VERSION).toBe(2));

  it('tier totals match the spec', () => {
    expect(sum(WEIGHTS.access)).toBe(15);
    expect(sum(WEIGHTS.permission)).toBe(15);
    expect(sum(WEIGHTS.readability)).toBe(35);
    expect(sum(WEIGHTS.understandability)).toBe(25);
    expect(sum(WEIGHTS.discoverability)).toBe(10);
  });

  it('grand total is 100', () => {
    const grand = Object.values(WEIGHTS).reduce((a, w) => a + sum(w), 0);
    expect(grand).toBe(100);
  });

  it('has a label for every tier', () => {
    for (const k of Object.keys(WEIGHTS)) expect(CATEGORY_LABELS[k as keyof typeof CATEGORY_LABELS]).toBeTruthy();
  });

  it('grades by threshold', () => {
    expect(gradeFor(90)).toBe('A');
    expect(gradeFor(70)).toBe('B');
    expect(gradeFor(55)).toBe('C');
    expect(gradeFor(54)).toBe('D');
    expect(gradeFor(35)).toBe('D');
    expect(gradeFor(34)).toBe('F');
  });
});
