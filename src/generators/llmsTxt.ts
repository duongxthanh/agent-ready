const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim();

export function generateLlmsTxt(o: { title: string; summary: string; links?: { label: string; url: string }[] }): string {
  const lines = [`# ${oneLine(o.title)}`, '', `> ${oneLine(o.summary)}`];
  if (o.links?.length) {
    lines.push('', '## Key pages');
    for (const l of o.links) {
      const label = oneLine(l.label).replace(/[\[\]]/g, '');
      const url = oneLine(l.url).replace(/[()\s]/g, '');
      lines.push(`- [${label}](${url})`);
    }
  }
  return lines.join('\n') + '\n';
}
