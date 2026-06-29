export interface MetaOptions {
  title: string;
  description: string;
  url?: string;
  siteName?: string;
  image?: string;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/[\r\n]+/g, ' ')
    .trim();
}

export function generateMetaTags(o: MetaOptions): string {
  const t = esc(o.title);
  const d = esc(o.description);
  const lines = [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}">`,
    `<meta property="og:title" content="${t}">`,
    `<meta property="og:description" content="${d}">`,
    `<meta property="og:type" content="website">`,
  ];
  if (o.siteName) lines.push(`<meta property="og:site_name" content="${esc(o.siteName)}">`);
  if (o.url) {
    lines.push(`<link rel="canonical" href="${esc(o.url)}">`);
    lines.push(`<meta property="og:url" content="${esc(o.url)}">`);
  }
  if (o.image) lines.push(`<meta property="og:image" content="${esc(o.image)}">`);
  lines.push(`<meta name="twitter:card" content="${o.image ? 'summary_large_image' : 'summary'}">`);
  lines.push(`<meta name="twitter:title" content="${t}">`);
  lines.push(`<meta name="twitter:description" content="${d}">`);
  if (o.image) lines.push(`<meta name="twitter:image" content="${esc(o.image)}">`);
  return lines.join('\n') + '\n';
}
