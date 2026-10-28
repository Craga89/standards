# Package management: pnpm

Every repo uses pnpm. Never commit `package-lock.json`, `yarn.lock` or `bun.lock`.

- Pin pnpm in `package.json` with `"packageManager": "pnpm@12.15.0"`. The `setup-node` action
  reads it, so CI and local versions match.
- Pin Node in `.node-version` (major only, e.g. `26`) and mirror it in `engines.node`.
- Use `pnpm install`, `pnpm <script>` and `pnpm exec <bin>`. Never `npm` or `npx`.
- Commit `pnpm-lock.yaml` with every dependency change. CI installs with
  `pnpm install --frozen-lockfile`.
- Pin dev dependencies to exact versions. Dependabot bumps them weekly in one grouped PR.
- Dependency install scripts only run when listed under `allowBuilds` in `pnpm-workspace.yaml`.
  Start with `allowBuilds: {}` and review any addition in its PR.

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
