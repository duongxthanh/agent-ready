# Playbook: Nuxt (Vue) & SvelteKit (Svelte)

**Symptom:** `stack` = `nuxt` or `sveltekit`. Both support SSR/SSG, so Readability
failures mean SSR/prerender is disabled, or content is fetched only on the client
(`onMounted` / browser-only `fetch`), leaving the initial HTML empty.

## Nuxt

1. **Enable SSR or prerender.** Nuxt SSRs by default; if `ssr: false` was set in
   `nuxt.config`, content is client-only — remove it or prerender:
   ```ts
   // nuxt.config.ts — prerender static routes (Nitro)
   export default defineNuxtConfig({
     nitro: { prerender: { crawlLinks: true, routes: ['/'] } },
   });
   ```
   For a fully static deploy: `nuxi generate`.
2. **Fetch on the server.** Use `useAsyncData` / `useFetch` (run during SSR) instead of
   fetching inside `onMounted`.
3. **Head + JSON-LD.** Use `useHead`/`useSeoMeta` for title/description/OG/canonical and
   to inject the JSON-LD `<script>`; set `lang` via `app.head.htmlAttrs.lang`.
4. **Artifacts.** Put `robots.txt` (with Content-Signal), `sitemap.xml`, `llms.txt` in
   `public/` (or use `@nuxtjs/sitemap`/`@nuxtjs/robots`).

## SvelteKit

1. **Enable SSR/prerender.** SSR is on by default; if a route set `export const ssr =
   false`, content is client-only. For static content prerender it:
   ```ts
   // +page.ts (or +layout.ts)
   export const prerender = true;
   ```
   Use `adapter-static` for a fully prerendered site.
2. **Load on the server.** Return data from `load` in `+page.ts`/`+page.server.ts` so it
   renders into the HTML, not in an `onMount` browser fetch.
3. **Head + JSON-LD.** Use `<svelte:head>` for title/description/OG/canonical and the
   JSON-LD `<script>`; set `<html lang>` in `app.html`.
4. **Artifacts.** Place `robots.txt` (with Content-Signal), `sitemap.xml`, `llms.txt` in
   `static/`. A `Link` header can be set in `handle` in `hooks.server.ts`.

## Verify

Re-scan the built/running site. Readability and Understandability should reach full once
content is server-rendered/prerendered and head tags + JSON-LD are present.
