# Playbook: Astro & static site generators (11ty, Hugo, Jekyll, plain HTML)

**Symptom:** `stack` = `astro` or `unknown`/`static`. These already ship real HTML, so
Readability usually passes. Failures are typically in Understandability and
Discoverability (missing JSON-LD, robots, sitemap, llms), or content that is hidden
behind a client-only island.

## Fix

1. **Artifacts (🟢).** Drop generated files into the published root:
   `robots.txt` (with the Content-Signal line), `sitemap.xml`, `llms.txt`. Astro has an
   official `@astrojs/sitemap` integration; otherwise write the generated file to
   `public/`.

2. **`<head>` (🟡).** Ensure each page sets title, meta description, Open Graph,
   `<html lang>`, and a canonical link. In Astro put these in the layout's `<head>`.

3. **JSON-LD.** Add a `<script type="application/ld+json">` in the layout from
   `generateJsonLd` with the correct schema.org type (LocalBusiness/Hotel/Restaurant for
   hospitality). It renders statically — perfect for crawlers.

4. **Watch for client-only islands.** If key content is inside an Astro island with
   `client:only` (no SSR fallback) it will be invisible to no-JS crawlers. Render that
   content server-side (default Astro behavior) or provide static fallback content; use
   `client:load`/`client:visible` (which SSR then hydrate) instead of `client:only` for
   anything that carries readable text.

## Verify

Re-scan. With artifacts + JSON-LD + head tags, a static site typically reaches A.
Remaining gaps are server-level (`di-link-headers`, `di-markdown`) — configure them at
the host/CDN if desired.
