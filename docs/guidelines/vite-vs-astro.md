# Choosing Vite or Astro

Both are Vite-based, so the plugin ecosystem, env handling (`import.meta.env`) and Vitest
work the same in either.

## Use Astro when the project is content-first

- Marketing sites, portfolios, blogs, documentation, landing pages.
- Most pages are mostly static. Interactivity lives in islands
  (`client:load` / `client:visible`).
- SEO and first-load performance matter more than client-side state.
- Content lives in Markdown/MDX or a CMS. Use **content collections** with schemas.

Conventions:

- Ship zero JS by default. Add `client:*` directives only where needed, preferring
  `client:visible` / `client:idle` over `client:load`.
- Use React (or another framework) only inside islands, never for whole pages.
- Use `astro check` as the `typecheck` script, and extend `astro/tsconfigs/strict`.
- Lint preset: `configs/oxlint/astro.json`. Enable `astro: true` in oxfmt.

## Use Vite when the project is application-first

- SPAs, dashboards, internal tools, anything behind a login with lots of client state.
- Component libraries and npm packages (Vite **library mode**).
- Browser extensions, embeddable widgets.

Conventions:

- React + TypeScript template (`pnpm create vite@latest -- --template react-ts`).
- Extend `configs/tsconfig/vite-react.json`. Lint preset: `configs/oxlint/react.json`.
- Use `vite preview` to sanity-check production builds locally.

## Neither

- Pure backend services and CLIs: plain TypeScript on Node, using `configs/tsconfig/node.json`
  and `configs/oxlint/base.json`. Bundle with Vite library mode (or `tsdown`) only if you need a
  single-file output.

## Testing (both)

Vitest for unit and component tests. Put tests next to the code (`foo.test.ts`). Playwright
for end-to-end tests when a project needs them.
