# Commits and pull requests

Commit messages and pull request titles follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): summary in the imperative, lowercase, no full stop
```

- **Types:** `feat` (something new for users), `fix` (a bug), `docs`, `style` (formatting only),
  `refactor`, `perf`, `test`, `build` (dependencies, build config, fonts), `ci` (workflows and
  actions), `chore` (anything else).
- **Scopes** are optional and listed per repo in its `CLAUDE.md` (e.g. `pages`, `a11y`, `e2e`,
  `deploy`, `lighthouse`, `deps`).
- **Breaking changes:** `!` after the type or scope, plus a `BREAKING CHANGE:` footer saying
  what breaks.
- The body, when there is one, explains what changed and why, wrapped at about 100 characters.
- PRs are squash-merged, so the PR title becomes the commit on the default branch. Give it the
  same form.
- CI passes before merge. Never commit secrets, `.env` files or build output.
