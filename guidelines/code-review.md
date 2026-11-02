# Code review

Adapted from how the Claude Code team reviews code (claude.dev, "How the Claude Code team does
code review", October 2026), for repos with one maintainer and coding agents doing much of the
writing. Review happens in layers, each catching what the one before can't, and a person decides
what merges.

## 1. Before the pull request

The author, person or agent, checks the change before anyone else reads it:

- `pnpm run verify` (lint, format, types, unit tests), plus the end-to-end tests when the change
  touches what a visitor sees.
- A review with fresh context: `/code-review` in Claude Code (a subagent that hasn't seen the
  conversation reads the diff), and `/security-review` when the change touches workflows,
  secrets, anything that runs user input, or a dependency.
- Look at the result: the branch preview for a site change, the built package
  (`pnpm pack --dry-run`) for a package change.

## 2. Every pull request

- **The PR template** (`.github/pull_request_template.md`) asks for **Testing** (what was run, and
  what wasn't), **Risk** (low, medium or high, and why) and **How to revert**. "Revert the commit"
  is a fine answer when it's true. It isn't for a published package version, which can only be
  replaced or deprecated, or a migration of stored data.
- **Required CI**, by check name in the ruleset.
- **Automated review**: Copilot code review on every push, following `.github/copilot-instructions.md`,
  which points at the repo's `REVIEW.md`. Claude follows the same file when asked to review.
- **Security review** that blocks: `security.yml`, calling the shared
  [`security-review.yml`](../.github/workflows/security-review.yml) (Claude Code, through
  `anthropics/claude-code-action`), reviews every push and fails
  on any finding. A finding clears when a later push fixes it, or when you've answered it (a false
  positive, or a risk you accept) and add the `security-accepted` label. The answer goes in a reply
  to the finding's comment, so the reason is on record. Pull requests from forks and Dependabot
  aren't reviewed (they can't sign in, and their content shouldn't steer an agent), and a skipped
  check passes, so review those yourself.
- **Every finding is answered**, from either reviewer: fixed, or a reply saying why not. The
  ruleset requires every conversation resolved before merging, which enforces it.

## 3. REVIEW.md

Each repo has a short `REVIEW.md` ([template](../templates/REVIEW.md)) for whoever reviews it,
person or model. It isn't a style guide (the formatter and linter own style) and it isn't
`CLAUDE.md` (how to work here). It says:

- **What failure looks like here**: the specific ways a change has broken this repo or its users
  before. That list is the most useful part, so keep it current.
- **What to skip**: generated files, lockfiles, build output, vendored code.
- **How to report**: every finding with `file:line` and the evidence, tagged **Important** (must
  fix before merge), **Nit** (at most three per review) or **Pre-existing** (true, but not this
  change's fault). The summary starts with the count of Important findings, and says plainly
  "Nothing to fix" when there's nothing.

When a bug gets past review, add it to "What failure looks like" in the same PR that fixes it.
Escaped bugs are the best test of what review should catch.

## 4. Converging

Review that never runs out of things to say is noise. So:

- **At most three rounds** of review on a pull request. After the third, anything new is a
  follow-up issue, unless it's Important.
- **After the first round, review the new diff**, not the whole PR again.
- **Flag a class of bug once**, listing every place it occurs, rather than one comment each.
- **Don't repeat a finding** that's been answered. A reply saying why not is an answer.
- **Measure the noise by the answers**: a finding answered "won't fix" or "not a bug" more than
  once is a sign `REVIEW.md` should say to skip it.

## 5. Approval and merge

- With one maintainer, GitHub won't count your own approval, so the rulesets require none. Your
  merge is the approval: read the evidence (the checks, the findings and their answers, the
  preview) before merging. A bot's approval never counts.
- High-risk changes (a workflow's permissions, the release, secrets, anything that publishes)
  get a second look the next day, or a second reviewer when there is one.
- Squash-merge, with linear history. Keep releases small and easy to revert: a site deploys from
  `main` and a revert redeploys it; a package release is a version bump, and a bad one is fixed by
  the next.

## Setup

1. Copy from [`templates/`](../templates): `REVIEW.md` (then fill it in),
   `.github/pull_request_template.md`, `.github/copilot-instructions.md` and
   `.github/workflows/security.yml`. Optionally add `.github/security-review.md`: what matters
   most for security in this repo, which the review reads first.
2. Let the review sign in with
   [workload identity federation](https://platform.claude.com/docs/en/manage-claude/wif-providers/github-actions),
   so there's no API key to store. Once, in the Claude Console (Settings → Workload identity →
   Connect workload → GitHub Actions), create a federation rule for pull request runs, e.g.
   `subject_prefix: "repo:Craga89@187963/*"`, `audience: "https://api.anthropic.com"` and
   `claims: {"repository_owner_id": "187963", "event_name": "pull_request"}`, with its service
   account, one workspace (or the workflow must also pass `workspace-id`) and scope
   `workspace:developer`. GitHub's subject puts each name's ID after it
   (`repo:Craga89@187963/standards@1436925586:pull_request`), so a prefix of `repo:Craga89/` never
   matches; the IDs also survive a rename. The Console's authentication history shows each
   token's claims and why it was refused. Then in each repo add three repository variables
   (Settings → Secrets and variables → Actions → Variables): `ANTHROPIC_FEDERATION_RULE_ID`,
   `ANTHROPIC_ORGANIZATION_ID` and `ANTHROPIC_SERVICE_ACCOUNT_ID`. They're IDs, not secrets.
   Each review costs a little; with a handful of pull requests a week it's a few dollars a month.
3. Create the `security-accepted` label.
4. In the branch ruleset: require **security / Security review** as a status check, require
   conversations to be resolved before merging, and turn on Copilot code review of new pushes.
