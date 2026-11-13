# Package management: pnpm

Every repo uses pnpm. Never commit `package-lock.json`, `yarn.lock` or `bun.lock`.

- Pin pnpm in `package.json` with `"packageManager": "pnpm@12.15.0"`. The `setup-node` action
  reads it, so CI and local versions match.
- Pin Node in `.node-version` (major only, e.g. `26`) and mirror it in `engines.node`.
- Use `pnpm install`, `pnpm <script>` and `pnpm exec <bin>`. Never `npm` or `npx`.
- Commit `pnpm-lock.yaml` with every dependency change. CI installs with
  `pnpm install --frozen-lockfile`.
- Pin dev dependencies to exact versions. Dependabot bumps them weekly in one grouped PR (see
  [Dependency updates](#dependency-updates)).
- Dependency install scripts only run when listed under `allowBuilds` in `pnpm-workspace.yaml`.
  Start with `allowBuilds: {}` and review any addition in its PR.

## Dependency updates

Dependabot opens one grouped pull request a week per ecosystem (`npm`, `github-actions`), with a
7-day `cooldown`, so a release has had a week to be found out and pulled before it reaches a repo.

Patch and minor updates merge by themselves: `.github/workflows/dependabot.yml`
([template](../templates/.github/workflows/dependabot.yml)) calls the shared
[`dependabot-auto-merge.yml`](../.github/workflows/dependabot-auto-merge.yml), which turns on
auto-merge, so the pull request merges once every required check passes. A major update, or one
that fails a check, waits for a person. A grouped pull request counts as its biggest update.

- **Required checks are the gate.** Auto-merge waits for the checks the default branch's ruleset
  requires and nothing else, so require the ones that matter (lint, types, unit and end-to-end
  tests, the build). The workflow does nothing on a branch that requires none.
- **It merges as a GitHub App.** A merge made with the workflow's `GITHUB_TOKEN` doesn't start the
  workflows that run on a push to the default branch, so nothing would deploy. Create one App for
  your account with **Contents**, **Pull requests** and **Workflows** (read and write; Workflows
  because the actions group's updates change workflow files), install it on the repos, and add its
  client ID and a private key as the **Dependabot** secrets `MERGE_APP_CLIENT_ID` and
  `MERGE_APP_PRIVATE_KEY`: workflows Dependabot starts can't see Actions secrets.
- **Hold a dependency back** with an `ignore` rule in `.github/dependabot.yml`, with a comment
  saying why and when to remove it.

## Script names

The shared workflows call these, so keep the names:

| Script         | Runs                                                                 |
| -------------- | -------------------------------------------------------------------- |
| `dev`          | The dev server (`astro dev` / `vite`)                                |
| `build`        | The production build                                                 |
| `lint`         | `oxlint`                                                             |
| `format`       | `oxfmt .`                                                            |
| `format:check` | `oxfmt --check .`                                                    |
| `typecheck`    | `astro check && tsc -p tsconfig.node.json` (or `tsc`)                |
| `test`         | `test:unit` then `test:e2e`                                          |
| `test:unit`    | `node --test` with coverage thresholds                               |
| `test:e2e`     | `playwright test --project=desktop --project=mobile`                 |
| `test:a11y`    | The axe projects (`a11y-desktop`, `a11y-mobile`)                     |
| `verify`       | `lint`, `format:check`, `typecheck`, `test:unit`: run before pushing |
