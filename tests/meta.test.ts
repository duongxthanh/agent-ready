import { describe, it, expect } from 'vitest';
import { generateMetaTags } from '../src/generators/meta.js';

describe('generateMetaTags', () => {
  it('emits title, description, canonical, OG and Twitter tags', () => {
    const out = generateMetaTags({ title: 'Seabreeze Hotel', description: 'Boutique hotel in Hoi An', url: 'https://x.com', image: 'https://x.com/og.jpg', siteName: 'Seabreeze Hotel' });
    expect(out).toContain('<title>Seabreeze Hotel</title>');
    expect(out).toContain('<meta name="description" content="Boutique hotel in Hoi An">');
    expect(out).toContain('<link rel="canonical" href="https://x.com">');
    expect(out).toContain('<meta property="og:title" content="Seabreeze Hotel">');
    expect(out).toContain('<meta property="og:image" content="https://x.com/og.jpg">');
    expect(out).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(out).toContain('<meta name="twitter:image" content="https://x.com/og.jpg">');
    expect(out).toContain('<meta property="og:site_name" content="Seabreeze Hotel">');
  });

  it('uses summary card when no image and escapes HTML-special chars', () => {
    const out = generateMetaTags({ title: 'A & B <Z>', description: 'x "y"' });
    expect(out).toContain('<meta name="twitter:card" content="summary">');
    expect(out).toContain('<title>A &amp; B &lt;Z&gt;</title>');
    expect(out).toContain('content="x &quot;y&quot;"');
    expect(out).not.toContain('<Z>');
  });

  it('omits canonical/og:url when no url given', () => {
    const out = generateMetaTags({ title: 'T', description: 'D' });
    expect(out).not.toContain('rel="canonical"');
    expect(out).not.toContain('og:url');
  });

  it('omits twitter:image and og:image when no image given', () => {
    const out = generateMetaTags({ title: 'T', description: 'D' });
    expect(out).not.toContain('twitter:image');
    expect(out).not.toContain('og:image');
  });
});
