# standards

Shared GitHub Actions, config presets and coding guidelines for my repos, extracted from
[portfolio](https://github.com/Craga89/portfolio) and [craigsworks](https://github.com/Craga89/craigsworks).

| Concern          | Choice                                                   |
| ---------------- | -------------------------------------------------------- |
| Package manager  | pnpm, pinned via `packageManager`                        |
| Lint / format    | oxlint + oxfmt                                           |
| Sites            | Astro                                                    |
| Apps & libraries | Vite                                                     |
| Types            | `tsc` strict, JavaScript included (`checkJs`)            |
| Tests            | `node --test`, Playwright, axe (WCAG 2.2 AA), Lighthouse |
| CI               | GitHub Actions, SHA-pinned, Dependabot weekly            |

## Guidelines

- [Tooling overview](docs/guidelines/tooling.md)
- [Package management](docs/guidelines/package-management.md)
- [Linting and formatting](docs/guidelines/linting-and-formatting.md)
- [Choosing Astro or Vite](docs/guidelines/astro-vs-vite.md)
- [Types](docs/guidelines/types.md)
- [Testing](docs/guidelines/testing.md)
- [GitHub Actions](docs/guidelines/github-actions.md)
- [Commits and pull requests](docs/guidelines/git.md)

## Composite actions

Pin each to a commit SHA, as you would any third-party action.

| Action             | Does                                                                                                               | Inputs                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| `setup-node`       | pnpm from `packageManager`, Node from `.node-version` with the pnpm store cached, `pnpm install --frozen-lockfile` | `working-directory`, `install` |
| `setup-playwright` | Chromium for the installed Playwright version, cached, with its system libraries. Run after `setup-node`           | none                           |
| `publish-branch`   | Replaces a branch's contents with a directory, as one commit with no history (report branches)                     | `branch`, `source`, `message`  |
| `report-meta`      | Writes `commit.txt`, `run.txt` and `at.txt` into a report directory                                                | `dir`, `sha`                   |

```yaml
- uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
- uses: Craga89/standards/setup-node@<sha> # v1.0.0
- uses: Craga89/standards/setup-playwright@<sha> # v1.0.0
```

## Reusable workflows

| Workflow      | Does                                                                                            | Inputs                         |
| ------------- | ----------------------------------------------------------------------------------------------- | ------------------------------ |
| `quality.yml` | `lint` + `format:check`, then `typecheck` + `test:unit` (optionally against a downloaded build) | `build-artifact`, `build-path` |

```yaml
jobs:
  quality:
    needs: build
    uses: Craga89/standards/.github/workflows/quality.yml@<sha> # v1.0.0
    with:
      build-artifact: build
```

Still to come (from the extraction plan): `playwright-suite`, `lighthouse`, `a11y-live`,
`link-check` and `pages-deploy`.

## Adopting in a repo

```bash
pnpm add -D -E oxlint oxfmt github:Craga89/standards#v1
```

Then copy what applies from [`templates/`](templates): `.oxlintrc.json`, `oxfmt.config.ts`,
`tsconfig.node.json`, `.editorconfig`, `pnpm-workspace.yaml`, `.github/dependabot.yml`,
`.github/workflows/ci.yml`, and `AGENTS.md` + `CLAUDE.md` for coding agents.

## Versioning

Tags `vX.Y.Z` for each release, plus `v1` moved forward on every non-breaking one. Callers pin a
SHA and let Dependabot bump it. A breaking change starts `v2`.

## License

[MIT](LICENSE)
