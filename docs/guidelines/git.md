# Git and pull requests

- Default branch is `main`. Branch per change: `feat/…`, `fix/…`, `chore/…`, `docs/…`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org):
  `feat: add pnpm setup action`, `fix(ci): cache key for monorepos`.
- Keep PRs small and focused. The description explains _why_, plus anything a reviewer
  can't see in the diff.
- CI (format, lint, typecheck, test, build) must pass before merge. Squash-merge by default.
- Never commit secrets, `.env` files or build output.
