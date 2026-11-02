# Reviewing changes to this repo

For whoever reviews a pull request here, person or model. Style is the formatter's and linter's
job, not review's. See [code-review.md](https://github.com/Craga89/standards/blob/main/guidelines/code-review.md).

## What failure looks like here

<!-- The specific ways a change has broken this repo or its users, most damaging first. Add one
whenever a bug gets past review. -->

- …

## Skip

- `pnpm-lock.yaml` (review the `package.json` change instead)
- Build output and generated reports

## How to report

- Every finding has `file:line` and the evidence: the input that breaks, the output that's wrong.
  No evidence, no finding.
- Tag each one **Important** (fix before merging), **Nit** (at most three in a review) or
  **Pre-existing** (true, but not this change's doing).
- One comment for a class of bug, listing every place it occurs.
- After the first round, review only what changed since, and don't repeat a finding that's been
  answered.
- Start the summary with the number of Important findings. When there are none, say "Nothing to
  fix."
