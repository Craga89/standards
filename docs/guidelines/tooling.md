# Tooling

The default toolchain for every repo, taken from what `portfolio` and `craigsworks` already do.
A repo that deviates says why in its README.

| Concern          | Use                                                  | Not                  |
| ---------------- | ---------------------------------------------------- | -------------------- |
| Package manager  | pnpm, pinned in `packageManager`                     | npm, npx, yarn, bun  |
| Node             | Current release, pinned in `.node-version` (26)      | `.nvmrc`             |
| Linting          | oxlint                                               | ESLint, Biome        |
| Formatting       | oxfmt                                                | Prettier, Biome      |
| Content sites    | Astro                                                | Next.js, Gatsby      |
| Apps & libraries | Vite                                                 | webpack, Parcel, CRA |
| Types            | `tsc` in strict mode, checking JS (`checkJs`) and TS | unchecked JS         |
| Unit tests       | `node --test`, with coverage thresholds              | Jest                 |
| End-to-end       | Playwright (desktop and mobile projects)             | Cypress              |
| Accessibility    | axe through Playwright, WCAG 2.2 AA                  |                      |
| Performance      | Lighthouse, audited after each deploy                |                      |
| CI               | GitHub Actions, SHA-pinned, Dependabot weekly        |                      |

- [Package management](./package-management.md)
- [Linting and formatting](./linting-and-formatting.md)
- [Choosing Astro or Vite](./astro-vs-vite.md)
- [Types](./types.md)
- [Testing](./testing.md)
- [GitHub Actions](./github-actions.md)
- [Commits and pull requests](./git.md)
