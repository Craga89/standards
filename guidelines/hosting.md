# Hosting

**Status:** proposed, piloting on `Craga89/portfolio` (November 2026). GitHub Pages remains the
standard until the pilot is done; this page then becomes the standard, or records why not.

## Decision

Sites deploy to **Cloudflare Workers with static assets**: a Worker with no code, serving the
build output (`assets.directory`). Not Cloudflare Pages: Cloudflare now recommends Workers for new
projects, and new features land there. Branch previews use **Worker Previews**
(`wrangler preview`), one per branch. GitHub Pages stays fine for small docs sites that don't want
a Cloudflare account.

## Why

|                  | GitHub Pages                                                                                                         | Workers static assets                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Previews         | Folders on the `pages` branch under `/preview/<slug>/`, kept by `pages-store` (pruning, an index page, push retries) | `wrangler preview --name <branch>`: a URL of its own per branch, served from `/`; `wrangler preview delete` removes it |
| Base path        | Every page built for its preview's path (`SITE_BASE`); links that ignore it break previews                           | Always `/`: the base path machinery, and that class of bug, go away                                                    |
| Response headers | None (CSP only as `<meta>`, which can't set `frame-ancestors` or reporting)                                          | `_headers`: real CSP, `X-Robots-Tag`, cache lifetimes per path                                                         |
| Redirects        | None (meta refresh, or a separate redirect service)                                                                  | `_redirects`: real 301s                                                                                                |
| Caching          | 10 minutes for every file                                                                                            | Per path: a year for hashed assets                                                                                     |
| Deploys          | Atomic, rollback by redeploying an old commit                                                                        | Atomic versions, rollback in seconds (`wrangler rollback`), gradual rollouts                                           |
| APIs             | Elsewhere, cross-origin                                                                                              | The same Worker can serve `/api/*` next to the site                                                                    |
| Preview privacy  | Public                                                                                                               | Public, or behind Cloudflare Access                                                                                    |
| Cost             | Free for public repos                                                                                                | Free: requests for static assets are free and unlimited                                                                |

Speed is similar: both are large CDNs.

## Costs

- **A Cloudflare API token in CI.** Wrangler signs in with an API token, not OIDC, unlike the
  security review's workload identity federation. Scope it to **Edit Workers** on one account, as
  a repository secret (`CLOUDFLARE_API_TOKEN`, with `CLOUDFLARE_ACCOUNT_ID`).
- **The domain's DNS on Cloudflare.** A Worker's custom domain needs the zone in the same account.
- **Free plan limits:** 20,000 files per deployment (25 MiB each), 100 Workers per account.
- **Rework here:** the preview workflows (`preview.yml`, `pages-deploy.yml`, `pages-store`,
  `preview-name`, `preview-status`) give way to a smaller pair built on `wrangler`. That's a major
  version, with the GitHub Pages flow kept until every site has moved.

Leaving stays cheap: the build output is plain static files that any host can serve.

## Pilot

`Craga89/portfolio` deploys the same build to Cloudflare alongside GitHub Pages
(`.github/workflows/cloudflare.yml`, `cloudflare/wrangler.jsonc`, `cloudflare/_headers`): `main`
to the Worker's `workers.dev` address, other branches to Previews. craigthompson.dev stays on
GitHub Pages meanwhile. To finish:

1. Compare a few weeks of pilot deploys and Previews with GitHub Pages: reliability, deploy time,
   anything that breaks without a base path.
2. Move the CSP from `<meta>` to a header, and give hashed assets a long cache life (after giving
   unhashed files under `/assets/`, such as `ask-index.json`, hashed names or their own rule).
3. Cut craigthompson.dev over (the Worker's custom domain; drop the pilot's `noindex`), then
   retire its `pages` branch and GitHub Pages.
4. Extract the workflow into reusable ones here, and move `Craga89/craigsworks`.
