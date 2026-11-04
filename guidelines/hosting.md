# Hosting

**Status:** adopted (November 2026). `Craga89/portfolio` (craigthompson.dev) moved first;
`Craga89/craigsworks` follows. The GitHub Pages flow ([previews.md](previews.md)) stays for repos
that haven't moved.

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
| Preview privacy  | Public                                                                                                               | Behind Cloudflare Access (free): only you, and CI with a service token                                                 |
| Cost             | Free for public repos                                                                                                | Free: requests for static assets are free and unlimited                                                                |

Speed is similar: both are large CDNs.

## Costs

- **A Cloudflare API token in CI.** Wrangler signs in with an API token, not OIDC, unlike the
  security review's workload identity federation. Scope it to **Edit Workers** on one account, as
  a repository secret (`CLOUDFLARE_API_TOKEN`, with `CLOUDFLARE_ACCOUNT_ID`).
- **The domain's DNS on Cloudflare.** A Worker's custom domain needs the zone in the same account.
- **Free plan limits:** 20,000 files per deployment (25 MiB each), 100 Workers per account.
- **Two flows here for a while:** `cloudflare-preview.yml` and `cloudflare-deploy` replace the
  GitHub Pages ones (`preview.yml`, `pages-deploy.yml`, `pages-store`, `preview-name`,
  `preview-status`), which stay until every site has moved, then go in a major version.

Leaving stays cheap: the build output is plain static files that any host can serve.

## Setting a site up

1. **The Worker's config**, e.g. `cloudflare/wrangler.jsonc` ([template](../templates/cloudflare/wrangler.jsonc)):
   an assets-only Worker named after the repository, `assets.directory` pointing at the build,
   `html_handling` and `not_found_handling` to match the build (Astro: `auto-trailing-slash` and
   `404-page`), and a `previews` block (it can be empty). Keep it out of the repository root if
   anything else there runs wrangler. Add `wrangler` as an exact dev dependency.
2. **Headers** in `cloudflare/_headers` ([template](../templates/cloudflare/_headers)), copied into
   the build at deploy. The Preview workflow adds `X-Robots-Tag: noindex` for Previews, inside the
   `/*` rule: a request gets the headers of every pattern it matches, but a second rule with the
   same pattern replaces the first.
3. **Secrets:** `CLOUDFLARE_API_TOKEN` (an account API token with **Workers Scripts: Edit** on the
   one account) and `CLOUDFLARE_ACCOUNT_ID`. Wrangler has no OIDC sign-in. The token can deploy
   every Worker on the account, so only `wrangler` steps get it (step `env:`): never a job that
   builds or tests a branch, whose dependencies could read it. The shared workflow builds and
   checks in jobs without it.
4. **Previews:** `.github/workflows/preview.yml`
   ([template](../templates/.github/workflows/preview.yml)) calling
   [`cloudflare-preview.yml`](../.github/workflows/cloudflare-preview.yml). Every branch gets
   `https://<slug>-<worker>.<subdomain>.workers.dev/`, a **Preview** commit status and one pull
   request comment; deleting the branch deletes it. The build gets `PREVIEW_BRANCH` (show a preview
   bar, skip analytics and service workers) and `ALLOW_INDEXING=false`. The token only reaches `wrangler`, which runs from the default branch's checkout (its lockfile and Worker config) with the branch's built files, so a change to the Worker config shows in Previews once it's merged, and the pull request that sets a site up gets no Preview of its own (the workflow says so).
5. **Previews behind Cloudflare Access:** Previews are private, the live site public. Access is set
   once per account, not per site, and is free for up to 50 users (Zero Trust's free plan):
   1. Turn on Zero Trust (a team name and the free plan), then in **Workers & Pages**, protect
      **all Worker previews** in the account (not production). That attaches one reusable policy,
      "Cloudflare Workers Preview URLs", to every Worker's Previews, new Workers included. Allow
      your email address (sign-in is a one-time code by email).
   2. For CI: a **service token** (Zero Trust → Access → Service credentials), and a second rule on
      that policy, **Service Auth**, that includes it. Each repository gets it as
      `CLOUDFLARE_ACCESS_CLIENT_ID` and `CLOUDFLARE_ACCESS_CLIENT_SECRET`, passed to the Preview
      workflow as `access-client-id` and `access-client-secret`. The check command gets them as
      `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` and sends them as headers of the same
      names. The token only lets CI view Previews, so the branch's own check may have it.
      Without the token, the Preview workflow fails with a message saying so.
6. **The live site:** in the CI job that runs once every check passes on the default branch,
   [`cloudflare-deploy`](../github/actions/cloudflare-deploy/action.yml) after `setup-node`, then a
   check that the address serves the site. The site is served at the Worker's `workers.dev`
   address until the domain moves.

## Moving the domain

Done once per site, through the Cloudflare API or dashboard, with the domain's DNS on Cloudflare:

1. **Record the DNS records** that point at the old host (GitHub Pages: four `A` records to
   `185.199.108–111.153`, four `AAAA`, a `www` CNAME to `<owner>.github.io`). They're the rollback.
2. **Delete them and attach the domain** to the Worker (Workers → the Worker → Domains, or
   `PUT /accounts/{id}/workers/domains`). Cloudflare won't attach a hostname that has records, so
   the site is down for the seconds in between; Cloudflare then manages the record and certificate.
3. **Redirect `www`:** a proxied `AAAA` record for `www` to `100::`, and a redirect rule
   (`http.host eq "www.<domain>"` to `concat("https://<domain>", http.request.uri.path)`, 301,
   keeping the query string).
4. **Straight away, list the domain in the config** (`"routes": [{ "pattern": "<domain>",
   "custom_domain": true }]`, and `"workers_dev": false`) and deploy. Each deploy replaces the
   Worker's routes with the config's, so without it the next deploy detaches the domain; with it,
   deploys leave the domain as it is, and the token needs no Workers Routes permission.
5. **Retire the old host:** remove its deploy and preview workflows and `CNAME`, turn GitHub Pages
   off and delete the `pages` branch.

## How it went on craigthompson.dev

- The pilot ran alongside GitHub Pages (`main` to `workers.dev`, Previews per branch), with a
  self-check after each deploy (`tools/cloudflare-check.sh`: pages, redirects, 404s, robots and
  `noindex`, `live.json`, no preview bar). Use the same pattern.
- The switch took about three seconds of downtime.
- Things to know: Previews served from `/` don't trip base-path code, but anything keyed off a base
  path (a preview bar) needs `PREVIEW_BRANCH` instead; an API that checks origins (ask.sh) has to
  allow the Worker's addresses; a step piping `wrangler` into `tee` needs `shell: bash` (pipefail);
  `"workers_dev": false` also turned the Worker's Preview addresses off until `"preview_urls": true`
  was set; and the first version of the Preview workflow gave the token to the build, which the
  security review caught.
