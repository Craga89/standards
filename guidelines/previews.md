# Branch previews

Every pushed branch is built and served at `<site>/preview/<slug>/` on GitHub Pages, next to the
live site, before the checks run. The commit gets a **Preview** status linking to it, and the pull
request gets one comment with the link.

## How it fits together

| Step       | Where                                 | What happens                                                                                                                  |
| ---------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1. Push    | `preview.yml` (reusable)              | Names the preview, sets the **Preview** status to pending                                                                     |
| 2. Build   | `preview.yml`                         | Runs the build with `SITE_BASE=/preview/<slug>/`, read-only token                                                             |
| 3. Store   | `pages-store` action                  | Puts the build in `preview/<slug>/` on the `pages` branch, prunes previews of deleted branches, rewrites `preview/index.html` |
| 4. Comment | `preview-comment` action              | Posts the link on the branch's open PRs, unless one already has it                                                            |
| 5. Deploy  | `pages-deploy.yml` via `workflow_run` | Publishes the `pages` branch from the default branch                                                                          |
| 6. Live    | `preview-status` action               | Marks every published preview's commit **Preview: success**, linking to it                                                    |

A build or deploy failure sets the status to failure, linking to the run.

## Rules

- **Folder names are unique per branch.** The slug is the branch name made URL-safe plus six
  characters of its hash, so `feature/foo` and `feature-foo` never share or overwrite a folder.
- **The live site is never taken down.** It lives at the root of the `pages` branch and previews
  live under `preview/`; neither update touches the other. Pages only switches to a deployment once
  it's complete, and nothing is deployed until the branch has a live site at its root.
- **One comment per pull request, ever.** It's found by a hidden marker, and comment jobs run one
  at a time per branch, so two runs can't both post. The link never changes, so it never needs
  updating.
- **Previews stay out of search engines.** Builds get `ALLOW_INDEXING=false`, and the index page is
  `noindex`.
- **Deploys only from the default branch.** Previews are built on their branch but published by a
  `workflow_run` workflow, which runs from the default branch.

## Adopting

1. Copy `templates/.github/workflows/preview*.yml` and set the build inputs if the defaults
   (`pnpm run build`, output in `site/`, base path in `SITE_BASE`) don't fit.
2. Make the build read its base path from `SITE_BASE` (Astro: `base: process.env.SITE_BASE || '/'`).
3. In the CI job that publishes the live site, store it with `pages-store` (`target: ''`) and then
   call `pages-deploy.yml`:

   ```yaml
   publish:
     needs: [quality, e2e]
     if: github.ref_name == github.event.repository.default_branch && github.event_name != 'pull_request'
     runs-on: ubuntu-latest
     permissions:
       contents: write # the pages branch
     steps:
       - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
       - uses: actions/download-artifact@9000827ccba6bdab643e8b6fd33ac0654aef8333 # v8.0.2
         with: { name: build, path: site }
       - uses: Craga89/standards/github/actions/pages-store@<sha> # v1.0.0
         with: { source: site }
   deploy:
     needs: publish
     uses: Craga89/standards/.github/workflows/pages-deploy.yml@<sha> # v1.0.0
     permissions: { contents: read, pages: write, id-token: write, statuses: write }
   ```

4. In the repository's Pages settings, set the source to **GitHub Actions**.
