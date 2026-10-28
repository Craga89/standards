# Agent instructions

This repo follows https://github.com/Craga89/standards. In short:

- Use **pnpm** only (`pnpm add`, `pnpm exec`, `pnpm dlx`). Never npm/npx/yarn, and never
  create `package-lock.json`.
- Lint with **oxlint**, format with **oxfmt**. Don't add ESLint, Prettier or Biome.
- Before finishing a change, run: `pnpm format && pnpm lint && pnpm typecheck && pnpm test`.
- TypeScript strict, ESM, named exports, `import type` for type-only imports, `node:`
  prefix for built-ins.
- Commit messages use Conventional Commits.
