# Reviewing changes to this repo

For whoever reviews a pull request here, person or model. Two other repos run this code
(`Craga89/portfolio`, `Craga89/craigsworks`), so the question for every change is what it does
to them. Style is the formatter's and linter's job, not review's. See
[code-review.md](guidelines/code-review.md).

## What failure looks like here

- **A breaking change shipped as a minor one.** Renaming or removing an action input or output,
  moving an action, workflow or preset, or removing a step a caller relies on. It needs a major
  version bump and a note on how to migrate.
- **A `uses:` that isn't a full commit SHA**, including `Craga89/standards/...@v1` inside these
  workflows (a moved tag or branch would change what callers run), or a `# vX.Y.Z` comment that
  doesn't match the SHA.
- **Permissions.** A job asking for more than it needs, or a reusable workflow asking for more
  than its documented caller grants, which fails the whole run before it starts
  (`startup_failure`). Every non-read permission has a comment saying why.
- **Untrusted input in a `run:`.** `${{ github.event... }}`, branch names or PR titles interpolated
  into shell instead of passed through `env:`.
- **A preview overwriting the live site or another preview**: anything in `pages-store` that
  writes outside its target, stores a cancelled run's build, or brings back a deleted branch's
  preview.
- **Config presets that don't do what they say.** oxlint doesn't inherit `ignorePatterns` through
  `extends`; oxfmt has no `extends` at all. Check a preset change with `--print-config` from a
  consuming repo.
- **The package shipping more than `configs/`**, or gaining dependencies or install scripts (a
  pnpm config dependency can't have either). `tests/package.test.mjs` checks; don't weaken it.
- **A workflow change and a pin bump to it in the same PR** (see `CLAUDE.md`).

## Skip

- `pnpm-lock.yaml` (review the `package.json` change instead)
- Typos and wording in guidelines, unless they change the meaning

## How to report

- Every finding has `file:line` and the evidence: the input that breaks, the caller that fails.
  No evidence, no finding.
- Tag each one **Important** (fix before merging), **Nit** (at most three in a review) or
  **Pre-existing** (true, but not this change's doing).
- One comment for a class of bug, listing every place it occurs.
- After the first round, review only what changed since, and don't repeat a finding that's been
  answered.
- Start the summary with the number of Important findings. When there are none, say "Nothing to
  fix."
