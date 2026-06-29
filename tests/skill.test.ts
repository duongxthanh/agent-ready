import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const skill = readFileSync(join(here, '..', 'skill', 'SKILL.md'), 'utf8');

describe('SKILL.md', () => {
  it('has YAML frontmatter with name and description', () => {
    expect(skill.startsWith('---')).toBe(true);
    expect(skill).toMatch(/\nname:\s*agent-ready/);
    expect(skill).toMatch(/\ndescription:\s*.+/);
  });
  it('documents both modes, per-group approval, and the re-scan loop', () => {
    expect(skill).toContain('Retrofit');
    expect(skill).toContain('Preventive');
    expect(skill.toLowerCase()).toContain('approve');
    expect(skill.toLowerCase()).toContain('re-scan');
    expect(skill).toContain('agent-ready <target>');
  });
});
