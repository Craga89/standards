# Choosing Astro or Vite

Astro is built on Vite, so `import.meta.env`, Vite plugins and the dev server behave the same in
both. The question is whether the project is mainly pages or mainly an application.

## Astro: sites made of pages

Portfolios, company sites, blogs, docs and landing pages: both current sites
(`portfolio`, `craigsworks`) are Astro.

- Static output by default (`site/` as the build directory), deployed to GitHub Pages.
- No client JavaScript unless a page needs it. Use small `<script>` tags or islands
  (`client:visible`, `client:idle` before `client:load`).
- Content in Markdown/MDX under content collections, with a schema.
- `tsconfig.json` extends `astro/tsconfigs/strict` with `allowJs` and `checkJs`. Tools and tests
  get a `tsconfig.node.json` that extends
  `./node_modules/.pnpm-config/@craga89/standards/configs/tsconfig/base.json`.
- `typecheck` is `astro check && tsc -p tsconfig.node.json`.
- oxlint preset `astro.json`.

## Vite: applications and libraries

Tools behind a login, dashboards, anything with a lot of client state, embeddable widgets and
npm packages (library mode).

- `tsconfig.json` extends `./node_modules/.pnpm-config/@craga89/standards/configs/tsconfig/vite.json` (Bundler resolution, DOM types,
  `vite/client`).
- oxlint preset `vite.json`.
- Unit tests stay on `node --test`. Use Vitest only when the code under test needs Vite's
  transforms (imports of `.vue`/`.svelte` files, `import.meta.glob`, CSS modules).

## Neither

Workers, CLIs and scripts are plain ESM on Node (or the Workers runtime), checked by `tsc` against
the shared `tsconfig/base.json` and linted with `base.json`.
