export type RenderingMode = 'spa' | 'ssg' | 'ssr' | 'static' | 'unknown';
export type Framework =
  | 'next' | 'vite-react' | 'cra' | 'astro' | 'nuxt' | 'sveltekit' | 'unknown';

export interface StackProfile {
  framework: Framework;
  rendering: RenderingMode;
  confidence: 'high' | 'medium' | 'low';
  evidence: string[];
}

const RENDER_DEFAULT: Record<Framework, RenderingMode> = {
  next: 'ssr', nuxt: 'ssr', sveltekit: 'ssr', astro: 'static',
  'vite-react': 'spa', cra: 'spa', unknown: 'unknown',
};

function fromPackageJson(pkgRaw: string): StackProfile | null {
  let pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  try { pkg = JSON.parse(pkgRaw); } catch { return null; }
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  const has = (n: string) => Object.prototype.hasOwnProperty.call(deps, n);

  let framework: Framework = 'unknown';
  const evidence: string[] = [];
  if (has('next')) { framework = 'next'; evidence.push('dependency: next'); }
  else if (has('@sveltejs/kit')) { framework = 'sveltekit'; evidence.push('dependency: @sveltejs/kit'); }
  else if (has('nuxt')) { framework = 'nuxt'; evidence.push('dependency: nuxt'); }
  else if (has('astro')) { framework = 'astro'; evidence.push('dependency: astro'); }
  else if (has('react-scripts')) { framework = 'cra'; evidence.push('dependency: react-scripts'); }
  else if (has('vite') && (has('react') || has('@vitejs/plugin-react'))) { framework = 'vite-react'; evidence.push('dependency: vite + react'); }

  if (framework === 'unknown') return null;
  return { framework, rendering: RENDER_DEFAULT[framework], confidence: 'high', evidence };
}

function fromHtml(html: string): StackProfile {
  const evidence: string[] = [];
  let framework: Framework = 'unknown';
  let explicitMarker = false;

  if (html.includes('__NEXT_DATA__') || html.includes('/_next/')) { framework = 'next'; evidence.push('html: __NEXT_DATA__ / _next'); explicitMarker = true; }
  else if (html.includes('__NUXT__') || html.includes('id="__nuxt"')) { framework = 'nuxt'; evidence.push('html: __NUXT__'); explicitMarker = true; }
  else if (html.includes('astro-island') || html.includes('data-astro')) { framework = 'astro'; evidence.push('html: astro markers'); explicitMarker = true; }
  else if (html.includes('data-sveltekit')) { framework = 'sveltekit'; evidence.push('html: data-sveltekit'); explicitMarker = true; }

  // Empty-mount SPA fingerprint (Vite/CRA): a known mount node empty + module script.
  const emptyMount = /<div id="(?:root|app)"\s*>\s*<\/div>/i.test(html);
  const moduleScript = /<script[^>]+type="module"/i.test(html);
  if (framework === 'unknown' && emptyMount && moduleScript) {
    framework = html.includes('data-reactroot') ? 'cra' : 'vite-react';
    evidence.push('html: empty mount + module script');
  }

  // I2: a known framework's default rendering wins; empty-mount only decides when framework is unknown.
  let rendering: RenderingMode;
  if (framework !== 'unknown') {
    rendering = RENDER_DEFAULT[framework];
  } else if (emptyMount) {
    rendering = 'spa';
    evidence.push('html: empty mount node');
  } else {
    rendering = 'unknown';
  }

  // I1: explicit marker → high; inferred or unknown-with-rendering-guess → medium; fully unknown → low.
  const confidence = explicitMarker ? 'high'
    : (framework === 'unknown' && rendering === 'unknown' ? 'low' : 'medium');
  return { framework, rendering, confidence, evidence };
}

export function detectStack(input: { html?: string; packageJson?: string; files?: string[] }): StackProfile {
  if (input.packageJson) {
    const fromPkg = fromPackageJson(input.packageJson);
    if (fromPkg) return fromPkg;
  }
  if (input.html) return fromHtml(input.html);
  return { framework: 'unknown', rendering: 'unknown', confidence: 'low', evidence: [] };
}
