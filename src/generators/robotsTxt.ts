export interface RobotsOptions {
  sitemapUrl?: string;
  contentSignals?: { search?: boolean; aiInput?: boolean; aiTrain?: boolean };
}

const yn = (b: boolean) => (b ? 'yes' : 'no');

export function generateRobotsTxt(o: RobotsOptions = {}): string {
  const lines = ['User-agent: *', 'Allow: /'];
  if (o.contentSignals) {
    const cs = o.contentSignals;
    const parts: string[] = [];
    if (cs.search !== undefined) parts.push(`search=${yn(cs.search)}`);
    if (cs.aiInput !== undefined) parts.push(`ai-input=${yn(cs.aiInput)}`);
    if (cs.aiTrain !== undefined) parts.push(`ai-train=${yn(cs.aiTrain)}`);
    if (parts.length) lines.push(`Content-Signal: ${parts.join(', ')}`);
  }
  if (o.sitemapUrl) {
    const safe = o.sitemapUrl.replace(/[\r\n]/g, '');
    lines.push('', `Sitemap: ${safe}`);
  }
  return lines.join('\n') + '\n';
}
