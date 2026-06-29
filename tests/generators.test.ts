import { describe, it, expect } from 'vitest';
import { generateLlmsTxt } from '../src/generators/llmsTxt.js';
import { generateRobotsTxt } from '../src/generators/robotsTxt.js';
import { generateSitemap } from '../src/generators/sitemap.js';
import { generateJsonLd } from '../src/generators/jsonld.js';

describe('generators', () => {
  it('llms.txt has H1 + summary + links', () => {
    const out = generateLlmsTxt({ title: 'Seabreeze Hotel', summary: 'Boutique hotel', links: [{ label: 'Rooms', url: '/rooms' }] });
    expect(out.startsWith('# Seabreeze Hotel')).toBe(true);
    expect(out).toContain('> Boutique hotel');
    expect(out).toContain('[Rooms](/rooms)');
  });

  it('robots.txt allows AI bots and references sitemap', () => {
    const out = generateRobotsTxt({ sitemapUrl: 'https://x.com/sitemap.xml' });
    expect(out).toContain('User-agent: *');
    expect(out).toContain('Allow: /');
    expect(out).toContain('Sitemap: https://x.com/sitemap.xml');
  });

  it('sitemap wraps urls in a valid urlset', () => {
    const out = generateSitemap(['https://x.com/', 'https://x.com/rooms']);
    expect(out).toContain('<urlset');
    expect(out).toContain('<loc>https://x.com/rooms</loc>');
  });

  it('json-ld is valid parseable schema.org', () => {
    const out = generateJsonLd({ type: 'Hotel', name: 'Seabreeze Hotel', url: 'https://x.com', description: 'Boutique hotel' });
    const data = JSON.parse(out.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, ''));
    expect(data['@type']).toBe('Hotel');
    expect(data['@context']).toBe('https://schema.org');
  });

  it('escapes XML-special chars in sitemap urls', () => {
    const out = generateSitemap(['https://x.com/?a=1&b=2']);
    expect(out).toContain('<loc>https://x.com/?a=1&amp;b=2</loc>');
    expect(out).not.toContain('a=1&b=2</loc>');
  });

  it('prevents </script> breakout in json-ld', () => {
    const out = generateJsonLd({ type: 'Hotel', name: 'x</script><script>alert(1)' });
    expect(out).not.toContain('</script><script>');
    // still valid JSON after stripping the wrapping script tags
    const data = JSON.parse(out.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, ''));
    expect(data.name).toBe('x</script><script>alert(1)');
  });

  it('neutralizes </script> injection in non-name JSON-LD fields', () => {
    const out = generateJsonLd({ type: 'Hotel', name: 'X', telephone: 'a</script>b', openingHours: ['Mo 09:00-17:00\n<script>'] });
    expect(out).not.toContain('</script><');
    expect(out).not.toMatch(/<script>(?!.*application\/ld)/);
    const data = JSON.parse(out.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, ''));
    expect(data.openingHours[0]).toBe('Mo 09:00-17:00<script>');
  });

  it('strips CRLF from robots sitemap url', () => {
    const out = generateRobotsTxt({ sitemapUrl: 'https://x.com/sitemap.xml\nUser-agent: Evil\nDisallow: /' });
    const lines = out.split('\n').filter(l => l.trim());
    const hasEvilDirective = lines.some(l => l.trim() === 'User-agent: Evil');
    expect(hasEvilDirective).toBe(false);
  });

  it('robots.txt emits a Content-Signal line when requested', () => {
    const out = generateRobotsTxt({ sitemapUrl: 'https://x.com/sitemap.xml', contentSignals: { search: true, aiInput: true, aiTrain: false } });
    expect(out).toMatch(/^Content-Signal:\s*search=yes, ai-input=yes, ai-train=no$/m);
    expect(out).toContain('User-agent: *');
    expect(out).toContain('Sitemap: https://x.com/sitemap.xml');
  });

  it('robots.txt omits Content-Signal when not requested (backward compatible)', () => {
    const out = generateRobotsTxt({ sitemapUrl: 'https://x.com/sitemap.xml' });
    expect(out).not.toMatch(/content-signal/i);
  });

  it('neutralizes newline + markdown-link injection in llms.txt', () => {
    const out = generateLlmsTxt({
      title: 'Hotel\n# Injected',
      summary: 'ok\n> bad',
      links: [{ label: 'a]x', url: 'https://x.com/p)evil' }],
    });
    expect(out).not.toContain('\n# Injected');
    expect(out).not.toContain('\n> bad');
    expect(out).toContain('[ax](https://x.com/pevil)');
  });

  it('json-ld includes PostalAddress, geo, telephone and openingHours for a Hotel', () => {
    const out = generateJsonLd({
      type: 'Hotel', name: 'Seabreeze Hotel', url: 'https://x.com', description: 'Boutique hotel',
      telephone: '+84-235-123', priceRange: '$$', image: 'https://x.com/h.jpg',
      address: { street: '544 Cua Dai', locality: 'Hoi An', region: 'Quang Nam', postalCode: '560000', country: 'VN' },
      geo: { lat: 15.88, lng: 108.35 }, openingHours: ['Mo-Su 00:00-23:59'],
    });
    const data = JSON.parse(out.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, ''));
    expect(data['@type']).toBe('Hotel');
    expect(data.address['@type']).toBe('PostalAddress');
    expect(data.address.streetAddress).toBe('544 Cua Dai');
    expect(data.address.addressLocality).toBe('Hoi An');
    expect(data.geo['@type']).toBe('GeoCoordinates');
    expect(data.geo.latitude).toBe(15.88);
    expect(data.geo.longitude).toBe(108.35);
    expect(data.image).toBe('https://x.com/h.jpg');
    expect(data.telephone).toBe('+84-235-123');
    expect(data.priceRange).toBe('$$');
    expect(Array.isArray(data.openingHours)).toBe(true);
  });

  it('omits address entirely when no usable address fields are given', () => {
    const out1 = generateJsonLd({ type: 'Hotel', name: 'X' });
    const out2 = generateJsonLd({ type: 'Hotel', name: 'X', address: { street: '' } });
    const parse = (s: string) => JSON.parse(s.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, ''));
    expect(parse(out1).address).toBeUndefined();
    expect(parse(out2).address).toBeUndefined();
  });
});
