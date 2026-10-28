# Working on this repo

This repo is the source of truth for tooling and guidelines shared by `Craga89/portfolio`,
`Craga89/craigsworks` and future repos. They consume it in three ways, so a change here can break
them:

1. **Composite actions** at the root (`setup-node/`, `setup-playwright/`, `publish-branch/`,
   `report-meta/`) and **reusable workflows** in `.github/workflows/`, used as
   `Craga89/standards/<path>@<sha>`. Renaming an input or removing a step is a breaking change.
2. **Config presets** in `configs/`, installed as `github:Craga89/standards#v1` and read from
   `node_modules/@craga89/standards/configs/...`. Don't move or rename them, and keep the
   `exports` map in `package.json` in sync.
3. **Guidelines** in `docs/guidelines/`, linked from each repo's `AGENTS.md`.

Rules for changes:

- A reusable workflow's `./` paths resolve to the caller's checkout, so the workflows here refer
  to the actions here as `Craga89/standards/<action>@v1`. Ship action changes before the workflow
  changes that rely on them.
- A helper script an action needs lives inside that action's directory, so it downloads with it.
- Pin third-party actions to a commit SHA with a `# vX.Y.Z` comment, and add any new action
  directory to `.github/dependabot.yml`.
- Releases: tag `vX.Y.Z` and move `v1` to it. A breaking change starts `v2`.
- Before committing: `pnpm run verify`. CI also runs actionlint.
- Commits follow `docs/guidelines/git.md`. Scopes: `actions`, `workflows`, `configs`, `docs`,
  `deps`.
