# Package management: pnpm

Every repo uses **pnpm**. Never commit `package-lock.json`, `yarn.lock` or `bun.lock`.

## Rules

- Pin the pnpm version with the `packageManager` field in `package.json`. CI and Corepack both
  read it, so local and CI versions can't drift:
  ```json
  { "packageManager": "pnpm@12.15.0" }
  ```
- Pin Node with `.nvmrc` (major only, e.g. `24`) and mirror it in `engines.node`.
- Commit `pnpm-lock.yaml`. CI installs with `pnpm install --frozen-lockfile`. The shared
  `setup-node-pnpm` action does this for you.
- Use `pnpm exec <bin>` / `pnpm dlx <pkg>`. Don't use `npx`.
- Add dependencies with `pnpm add` (`-D` for dev). Don't hand-edit versions and skip the install.
- Monorepos use pnpm workspaces (`pnpm-workspace.yaml`) and the `workspace:*` protocol for
  internal packages. Run tasks with `pnpm -r` / `pnpm --filter <name>`.
- Only allow dependency build scripts you need (`onlyBuiltDependencies` in
  `pnpm-workspace.yaml`). Review new entries in PRs.

## Script names

Use these names so the shared CI workflow picks them up:

| Script         | Purpose                           |
| -------------- | --------------------------------- |
| `dev`          | Local dev server                  |
| `build`        | Production build                  |
| `typecheck`    | `tsc --noEmit` (or `astro check`) |
| `test`         | `vitest run`                      |
| `lint`         | `oxlint`                          |
| `lint:fix`     | `oxlint --fix`                    |
| `format`       | `oxfmt`                           |
| `format:check` | `oxfmt --check`                   |
