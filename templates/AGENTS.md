# Working on this repo

This repo follows [Craga89/standards](https://github.com/Craga89/standards). The short version:

- **pnpm only**, pinned in `package.json` (`packageManager`). Use `pnpm install`, `pnpm <script>`
  and `pnpm exec <bin>`, never npm or npx, and commit `pnpm-lock.yaml` with any dependency change.
- **oxlint and oxfmt** for linting and formatting. Don't add ESLint, Prettier or Biome.
- **Run `pnpm run verify`** (lint, format check, types, unit tests) before pushing.
- **Types are checked by `tsc`**, JavaScript included (`checkJs`). Write ESM.
- **Actions are pinned to commit SHAs.** Keep the `# vX.Y.Z` comment when you change one.
- **Commits and PR titles** follow Conventional Commits: `type(scope): summary`. See
  [git.md](https://github.com/Craga89/standards/blob/main/guidelines/git.md).
