import { describe, it, expect } from 'vitest';
import { detectStack } from '../src/detect.js';

describe('detectStack — package.json (folder)', () => {
  it('detects Next.js as ssr-capable', () => {
    const r = detectStack({ packageJson: JSON.stringify({ dependencies: { next: '14.0.0', react: '18' } }) });
    expect(r.framework).toBe('next');
    expect(r.rendering).toBe('ssr');
    expect(r.confidence).toBe('high');
  });

  it('detects Vite + React as SPA', () => {
    const r = detectStack({ packageJson: JSON.stringify({ devDependencies: { vite: '5', '@vitejs/plugin-react': '4' }, dependencies: { react: '18' } }) });
    expect(r.framework).toBe('vite-react');
    expect(r.rendering).toBe('spa');
  });

  it('detects Astro as static', () => {
    const r = detectStack({ packageJson: JSON.stringify({ dependencies: { astro: '4' } }) });
    expect(r.framework).toBe('astro');
    expect(r.rendering).toBe('static');
  });

  it('detects SvelteKit', () => {
    const r = detectStack({ packageJson: JSON.stringify({ devDependencies: { '@sveltejs/kit': '2' } }) });
    expect(r.framework).toBe('sveltekit');
  });

  it('detects CRA (react-scripts)', () => {
    const r = detectStack({ packageJson: JSON.stringify({ dependencies: { 'react-scripts': '5' } }) });
    expect(r.framework).toBe('cra');
    expect(r.rendering).toBe('spa');
  });
});

describe('detectStack — HTML fingerprints (url)', () => {
  it('detects Next from __NEXT_DATA__', () => {
    const r = detectStack({ html: '<html><body><div id="__next"></div><script id="__NEXT_DATA__">{}</script></body></html>' });
    expect(r.framework).toBe('next');
  });

  it('detects an empty Vite/React SPA shell', () => {
    const r = detectStack({ html: '<html><body><div id="root"></div><script type="module" src="/assets/index.js"></script></body></html>' });
    expect(r.rendering).toBe('spa');
  });

  it('detects Nuxt from __NUXT__', () => {
    const r = detectStack({ html: '<html><body><div id="__nuxt"></div><script>window.__NUXT__={}</script></body></html>' });
    expect(r.framework).toBe('nuxt');
  });

  it('falls back to unknown', () => {
    const r = detectStack({ html: '<html><body><p>plain</p></body></html>' });
    expect(r.framework).toBe('unknown');
    expect(r.confidence).toBe('low');
  });

  // I1: explicit marker → high confidence
  it('Next page with __NEXT_DATA__ gets confidence high', () => {
    const r = detectStack({ html: '<html><body><div id="__next"></div><script id="__NEXT_DATA__">{}</script></body></html>' });
    expect(r.framework).toBe('next');
    expect(r.confidence).toBe('high');
  });

  // I2 regression: Next page that also has an empty #root must not become spa
  it('Next page with __NEXT_DATA__ AND empty #root stays ssr (I2)', () => {
    const r = detectStack({ html: '<html><body><div id="root"></div><script id="__NEXT_DATA__">{}</script></body></html>' });
    expect(r.framework).toBe('next');
    expect(r.rendering).toBe('ssr');
  });

  // M3: empty Vite SPA shell → framework must be vite-react
  it('empty Vite/React SPA shell sets framework to vite-react (M3)', () => {
    const r = detectStack({ html: '<html><body><div id="root"></div><script type="module" src="/assets/index.js"></script></body></html>' });
    expect(r.framework).toBe('vite-react');
    expect(r.rendering).toBe('spa');
  });
});
