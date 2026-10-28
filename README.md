# standards

Shared engineering standards for my projects: reusable **GitHub Actions**, shared
**oxlint / oxfmt / TypeScript configs**, and the **coding guidelines** behind them.

## The stack at a glance

| Concern         | Choice                             |
| --------------- | ---------------------------------- |
| Package manager | pnpm (pinned via `packageManager`) |
| Lint / format   | oxlint + oxfmt                     |
| Apps & libs     | Vite (React + TS)                  |
| Content sites   | Astro                              |
| Tests           | Vitest                             |
| Language        | TypeScript, strict, ESM            |

## Guidelines

- [Tooling overview](docs/guidelines/tooling.md)
- [Package management (pnpm)](docs/guidelines/package-management.md)
- [Linting and formatting (oxlint + oxfmt)](docs/guidelines/linting-and-formatting.md)
- [Choosing Vite or Astro](docs/guidelines/vite-vs-astro.md)
- [TypeScript](docs/guidelines/typescript.md)
- [Git and pull requests](docs/guidelines/git.md)

## Adopting in a repo

```bash
pnpm add -D oxlint oxfmt github:Craga89/standards#v1
```

Then copy the files from [`templates/`](templates):

| File                       | What it does                                            |
| -------------------------- | ------------------------------------------------------- |
| `.oxlintrc.json`           | Extends a shared lint preset (`base`, `react`, `astro`) |
| `oxfmt.config.ts`          | Spreads the shared format options                       |
| `.github/workflows/ci.yml` | Calls the reusable CI workflow                          |
| `AGENTS.md` / `CLAUDE.md`  | Points coding agents at these standards                 |

And extend a shared tsconfig: `{ "extends": "@craga89/standards/tsconfig/vite-react" }`.

## GitHub Actions

### `setup-node-pnpm` (composite action)

Installs pnpm from `packageManager`, sets up Node (from `.nvmrc`) with the pnpm store
cached, then runs `pnpm install --frozen-lockfile`.

```yaml
- uses: actions/checkout@v7
- uses: Craga89/standards/.github/actions/setup-node-pnpm@v1
  # with:
  #   node-version: 24
  #   working-directory: apps/web
  #   install: false
```

### `node-ci.yml` (reusable workflow)

Runs `oxfmt --check`, `oxlint`, then the `typecheck`, `test` and `build` scripts if present.

```yaml
jobs:
  ci:
    uses: Craga89/standards/.github/workflows/node-ci.yml@v1
    # with:
    #   working-directory: apps/web
    #   run-build: false
```

## Versioning

Consumers pin to the major tag `v1`. Non-breaking changes move `v1` forward. Breaking
changes get a new major tag. Exact tags (`v1.2.0`) are also published for anyone who wants
to pin precisely.

## License

[MIT](LICENSE)
