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

- [Tooling overview](guidelines/tooling.md)
- [Package management](guidelines/package-management.md)
- [Linting and formatting](guidelines/linting-and-formatting.md)
- [Choosing Astro or Vite](guidelines/astro-vs-vite.md)
- [Types](guidelines/types.md)
- [Testing](guidelines/testing.md)
- [GitHub Actions](guidelines/github-actions.md)
- [Branch previews](guidelines/previews.md)
- [Commits and pull requests](guidelines/git.md)

## Composite actions

In [`github/actions/`](github/actions). Each one is used as `Craga89/standards/github/actions/<action>@<sha>`.

Pin each to a commit SHA, as you would any third-party action.

| Action             | Does                                                                                                               | Inputs                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| `setup-node`       | pnpm from `packageManager`, Node from `.node-version` with the pnpm store cached, `pnpm install --frozen-lockfile` | `working-directory`, `install` |
| `setup-playwright` | Chromium for the installed Playwright version, cached, with its system libraries. Run after `setup-node`           | none                           |
| `publish-branch`   | Replaces a branch's contents with a directory, as one commit with no history (report branches)                     | `branch`, `source`, `message`  |
| `report-meta`      | Writes `commit.txt`, `run.txt` and `at.txt` into a report directory                                                | `dir`, `sha`                   |

```yaml
- uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
- uses: Craga89/standards/github/actions/setup-node@<sha> # v1.0.0
- uses: Craga89/standards/github/actions/setup-playwright@<sha> # v1.0.0
```

## Reusable workflows

| Workflow              | Does                                                                                            | Inputs                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `quality.yml`         | `lint` + `format:check`, then `typecheck` + `test:unit` (optionally against a downloaded build) | `build-artifact`, `build-path`                         |
| `preview.yml`         | Builds the branch for `/preview/<slug>/`, stores it, comments the link; removes it on delete    | `build-command`, `build-dir`, `base-env`, `playwright` |
| `pages-deploy.yml`    | Publishes the `pages` branch to Pages, keeping the live site up, then marks previews live       | `store-branch`                                         |
| `preview-comment.yml` | Comments the preview link when a PR is opened                                                   | `site-url`                                             |

```yaml
jobs:
  quality:
    needs: build
    uses: Craga89/standards/.github/workflows/quality.yml@<sha> # v1.0.0
    with:
      build-artifact: build
```

Branch previews need three small caller workflows; see [previews.md](guidelines/previews.md)
and `templates/.github/workflows/preview*.yml`.

Still to come (from the extraction plan): `playwright-suite`, `lighthouse`, `a11y-live` and
`link-check`.

## Adopting in a repo

The config presets are published to npm as
[`@craga89/standards`](https://www.npmjs.com/package/@craga89/standards). Add it as a pnpm
config dependency, so repos read the shared files rather than copies
([details](guidelines/linting-and-formatting.md#setup)):

```bash
pnpm add -D -E oxlint oxfmt
pnpm add --config -E @craga89/standards
```

Then copy what applies from [`templates/`](templates): `.oxlintrc.json`, `oxfmt.config.ts`,
`tsconfig.node.json`, `.editorconfig`, `pnpm-workspace.yaml`, `.github/dependabot.yml`,
`.github/workflows/ci.yml`, and `AGENTS.md` + `CLAUDE.md` for coding agents.

## Versioning and releases

`package.json`'s version is the release. Merging a version bump to `main` publishes it to npm and
tags the commit `vX.Y.Z` ([`release.yml`](.github/workflows/release.yml)); other pushes publish
nothing. Publishing uses npm trusted publishing (GitHub's OIDC token, with provenance), so there's
no npm token anywhere: the package's trusted publisher on npmjs.com is this repo's `release.yml`,
allowed to `npm publish`. Repos pin the actions and workflows by commit SHA (Dependabot bumps them) and the
package by version and integrity ([updating](guidelines/linting-and-formatting.md#setup)). A breaking change bumps the
major version.

## License

[MIT](LICENSE)
