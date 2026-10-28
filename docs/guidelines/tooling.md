# Tooling

The default toolchain for every JavaScript/TypeScript repo. Deviations need a reason written in
that repo's README.

| Concern             | Tool                                               | Not                           |
| ------------------- | -------------------------------------------------- | ----------------------------- |
| Package manager     | [pnpm](https://pnpm.io)                            | npm, yarn, bun                |
| Linting             | [oxlint](https://oxc.rs/docs/guide/usage/linter)   | ESLint, Biome                 |
| Formatting          | [oxfmt](https://oxc.rs/docs/guide/usage/formatter) | Prettier, Biome               |
| App / library build | [Vite](https://vite.dev)                           | webpack, CRA, Parcel          |
| Content sites       | [Astro](https://astro.build)                       | Next.js static export, Gatsby |
| Tests               | [Vitest](https://vitest.dev)                       | Jest                          |
| Language            | TypeScript (strict)                                | plain JS for new code         |
| Node                | Current LTS, pinned in `.nvmrc`                    |                               |

See also: [package management](./package-management.md), [linting and formatting](./linting-and-formatting.md),
[choosing Vite or Astro](./vite-vs-astro.md), [TypeScript](./typescript.md).
