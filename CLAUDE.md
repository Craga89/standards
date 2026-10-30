# Working on this repo

This repo is the source of truth for tooling and guidelines shared by `Craga89/portfolio`,
`Craga89/craigsworks` and future repos. It's split by area (`github/actions/`, `guidelines/`,
`configs/`), and other repos consume it in three ways, so a change here can break them:

1. **Composite actions** in `github/actions/` (`setup-node`, `setup-playwright`, `publish-branch`,
   `report-meta`, and for branch previews `preview-name`, `pages-store`, `preview-status`,
   `preview-comment`), used as `Craga89/standards/github/actions/<action>@<sha>`, and **reusable
   workflows**, used as `Craga89/standards/.github/workflows/<workflow>.yml@<sha>` (GitHub only
   loads them from `.github/workflows/`). Moving or renaming an action, renaming an input or
   removing a step is a breaking change.
2. **Config presets** in `configs/`, published to npm as `@craga89/standards` and installed as a
   pnpm config dependency, so repos read them from
   `node_modules/.pnpm-config/@craga89/standards/configs/...`. Moving or renaming one is a
   breaking change; keep the `exports` map in `package.json` in sync. The package ships only
   `configs/`, and a config dependency can't have dependencies or install scripts
   (`tests/package.test.mjs` checks).
3. **Guidelines** in `guidelines/`, linked from each repo's `AGENTS.md`.

Rules for changes:

- A reusable workflow's `./` paths resolve to the caller's checkout, so the workflows here refer
  to the actions here as `Craga89/standards/github/actions/<action>@<sha> # v1`, pinned like any other action (a
  workflow can't name its own commit, so it pins the commit its actions were last changed in).
  Ship an action change first, then bump those pins in the workflows in a second PR. CI fails on
  any `uses:` that isn't a local path or a full commit SHA.
- A helper script an action needs lives inside that action's directory, or in `github/actions/lib/`
  when several actions share it (GitHub downloads the whole repo for any action, so
  `$GITHUB_ACTION_PATH/../lib` works). Scripts get tests in `tests/`.
- Pin every third-party action, and any tool a workflow downloads, to a commit SHA with a
  `# vX.Y.Z` comment (check it's that tag's: `git ls-remote <repo> 'refs/tags/vX.Y.Z^{}'`).
  Dependabot covers every action under `github/actions/*`.
- Releases: bump `version` in `package.json` (semver; a breaking change bumps the major) and
  merge. `release.yml` publishes it to npm and tags the commit `vX.Y.Z`. Don't tag by hand.
- Before committing: `pnpm run verify`. CI also runs actionlint.
- Commits follow `guidelines/git.md`. Scopes: `actions`, `workflows`, `configs`, `docs`,
  `deps`.
