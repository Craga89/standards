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
| Hosting          | Cloudflare Workers static assets, a Preview per branch   |

## Guidelines

- [Tooling overview](guidelines/tooling.md)
- [Package management](guidelines/package-management.md)
- [Linting and formatting](guidelines/linting-and-formatting.md)
- [Choosing Astro or Vite](guidelines/astro-vs-vite.md)
- [Types](guidelines/types.md)
- [Testing](guidelines/testing.md)
- [Component catalogues](guidelines/component-catalogue.md): Astrobook or Storybook, a story per
  component, and testing each one on its own
- [GitHub Actions](guidelines/github-actions.md)
- [Branch previews on GitHub Pages](guidelines/previews.md) (superseded by Cloudflare Previews)
- [Commits and pull requests](guidelines/git.md)
- [Code review](guidelines/code-review.md)
- [Hosting](guidelines/hosting.md): Cloudflare Workers static assets, and moving a domain

## Composite actions

In [`github/actions/`](github/actions). Each one is used as `Craga89/standards/github/actions/<action>@<sha>`.

Pin each to a commit SHA, as you would any third-party action.

| Action              | Does                                                                                                                              | Inputs                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `setup-node`        | pnpm from `packageManager`, Node from `.node-version` with the pnpm store cached, `pnpm install --frozen-lockfile`                | `working-directory`, `install`          |
| `setup-playwright`  | Chromium for the installed Playwright version, cached, with its system libraries. Run after `setup-node`                          | none                                    |
| `publish-branch`    | Replaces a branch's contents with a directory, as one commit with no history (report branches)                                    | `branch`, `source`, `message`           |
| `report-meta`       | Writes `commit.txt`, `run.txt` and `at.txt` into a report directory                                                               | `dir`, `sha`                            |
| `cloudflare-deploy` | Deploys a built site to its Cloudflare Worker (copies `_headers`, `wrangler deploy`), outputs its address. Run after `setup-node` | `config`, `build-dir`, `headers`, `url` |

```yaml
- uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
- uses: Craga89/standards/github/actions/setup-node@<sha> # v1.0.0
- uses: Craga89/standards/github/actions/setup-playwright@<sha> # v1.0.0
```

## Reusable workflows

| Workflow                    | Does                                                                                                                               | Inputs                                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `quality.yml`               | `lint` + `format:check`, then `typecheck` + `test:unit` (optionally against a downloaded build)                                    | `build-artifact`, `build-path`                                                                                  |
| `cloudflare-preview.yml`    | A Cloudflare Worker Preview per branch: builds, `wrangler preview`, **Preview** status, one PR comment; deletes it with the branch | `worker`, `workers-subdomain`, `config`, `build-command`, `build-dir`, `headers`, `playwright`, `check-command` |
| `preview.yml`               | GitHub Pages (superseded): builds the branch for `/preview/<slug>/`, stores it, comments the link                                  | `build-command`, `build-dir`, `base-env`, `playwright`                                                          |
| `pages-deploy.yml`          | GitHub Pages (superseded): publishes the `pages` branch, then marks previews live                                                  | `store-branch`                                                                                                  |
| `preview-comment.yml`       | GitHub Pages (superseded): comments the preview link when a PR is opened                                                           | `site-url`                                                                                                      |
| `security-review.yml`       | Claude's security review of a PR; fails on any finding until it's fixed or accepted                                                | `model`, `instructions`, federation IDs                                                                         |
| `dependabot-auto-merge.yml` | Turns on auto-merge for Dependabot's patch and minor updates, as a GitHub App, on a branch that requires checks                    | `update-types`, `merge-method`; App secrets                                                                     |

```yaml
jobs:
  quality:
    needs: build
    uses: Craga89/standards/.github/workflows/quality.yml@<sha> # v1.0.0
    with:
      build-artifact: build
```

Sites are hosted on Cloudflare: a Worker config and headers (`templates/cloudflare/`), one caller
workflow for Previews (`templates/.github/workflows/preview.yml`) and `cloudflare-deploy` in CI; see
[hosting.md](guidelines/hosting.md). The GitHub Pages flow ([previews.md](guidelines/previews.md))
stays until every site has moved.

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
`.github/workflows/ci.yml`, `AGENTS.md` + `CLAUDE.md` for coding agents, and for review
`REVIEW.md`, `.github/pull_request_template.md`, `.github/copilot-instructions.md` and
`.github/workflows/security.yml` ([code-review.md](guidelines/code-review.md#setup)).

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
