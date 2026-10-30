# GitHub Actions

- **Pin every action to a full commit SHA**, with the version as a comment:
  `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1`. Dependabot keeps them
  current with one grouped PR a week. Pin `Craga89/standards` the same way (its own workflows pin
  its actions by SHA too, so a pinned workflow never runs code you haven't pinned), and any tool a
  workflow downloads (`go run …@<sha>`, release binaries) too: a tag can be moved, a SHA can't.
- **Least privilege.** `permissions: contents: read` at the top of every workflow, and anything
  more on the job that needs it, with a comment saying why. A reusable workflow can't get more
  than its calling job grants.
- **Timeouts on every job** (`timeout-minutes`), sized to about twice a normal run.
- **Concurrency**: `group: <workflow>-${{ github.ref }}`, cancelling in progress on pull
  requests only.
- **Don't hardcode the default branch** (`master` in craigsworks, `main` in portfolio). Compare
  with `github.event.repository.default_branch`. Deploy only from the default branch, never from
  a pull request.
- **Explain the workflow at the top**: what it's for, what calls it, and a small diagram of the
  job graph when there is more than one job.
- **Pass inputs through `env:`** into `run:` scripts, never `${{ }}` inside the script itself.
- Share code by moving it here: composite actions in `github/actions/`, reusable workflows in
  `.github/workflows/`. Triggers, schedules and the job graph stay in each repo.
