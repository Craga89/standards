# Branch previews on GitHub Pages

> **Superseded** by Cloudflare Worker Previews ([hosting.md](hosting.md)): sites on Cloudflare get
> a Preview of their own per branch from `cloudflare-preview.yml`. This flow stays for sites still
> on GitHub Pages, until they move.

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
- **Previews stay out of search results and AI tools.** Every preview page is `noindex`, and the
  live site's robots.txt keeps AI crawlers out of `/preview/`. See
  [Keeping previews out of search and AI tools](#keeping-previews-out-of-search-and-ai-tools).
- **Deploys only from the default branch.** Previews are built on their branch but published by a
  `workflow_run` workflow, which runs from the default branch.

## Keeping previews out of search and AI tools

Previews are public: GitHub Pages serves them to anyone with the address, and the links sit in public
pull requests. Nothing secret goes in a preview. What these rules prevent is a half-finished branch
turning up in search results, AI answers or training data in place of the live page.

Search engines and AI crawlers listen to different signals, so a preview needs both:

| Who                                                                                   | What keeps previews out                                                       | Where it's set                                 |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------- |
| Search engines (Googlebot, Bingbot and the engines IndexNow reaches)                  | `<meta name="robots" content="noindex, nofollow, noarchive">`                 | Every page of a preview build, and `/preview/` |
| AI crawlers for training and AI search (see the list below)                           | `Disallow: /preview/` for each of them                                        | The live site's robots.txt                     |
| Fetches a person asks an AI tool to make (ChatGPT-User, Claude-User, Perplexity-User) | Nothing reliable: they may ignore robots.txt, so preview links stay on GitHub | Nowhere                                        |

### Rules

- **Every preview page is `noindex, nofollow, noarchive`.** The build sees `ALLOW_INDEXING=false`
  and adds the tag to every page; `pages-store` adds it to the `/preview/` index. Don't rely on the
  site's default: a page with its own robots tag (a 404, say) still needs `noindex` in a preview.
- **Never `Disallow: /preview/` for search engines.** A crawler can only read `noindex` on a page it
  may fetch. A blocked address that's linked from somewhere can still be listed, as a bare link with
  no description, and it stays there because the crawler never sees the tag.
- **Do disallow `/preview/` for AI crawlers.** They decide what to read from robots.txt, not from
  the page's tags. Only the live site's robots.txt counts (robots.txt is read from the root of the
  host), so the live build writes these groups:

  ```
  User-agent: *
  Allow: /

  User-agent: GPTBot
  User-agent: OAI-SearchBot
  User-agent: ClaudeBot
  User-agent: Claude-SearchBot
  User-agent: Google-Extended
  User-agent: PerplexityBot
  Disallow: /preview/

  Sitemap: https://<site>/sitemap.xml
  ```

  | Agent              | Company    | Used for                                                                      |
  | ------------------ | ---------- | ----------------------------------------------------------------------------- |
  | `GPTBot`           | OpenAI     | Training data                                                                 |
  | `OAI-SearchBot`    | OpenAI     | ChatGPT search results                                                        |
  | `ClaudeBot`        | Anthropic  | Training data                                                                 |
  | `Claude-SearchBot` | Anthropic  | Claude's search results                                                       |
  | `Google-Extended`  | Google     | Gemini training and grounding. Not a crawler: it doesn't affect Google Search |
  | `PerplexityBot`    | Perplexity | Perplexity's search results                                                   |

  A crawler obeys the most specific group that names it, so these agents skip `/preview/` and read
  the rest of the site as usual. The live site stays open to AI tools. Check the list against each
  company's crawler page once a year, as names are added.

- **Canonical links point at the live page.** A preview page's `<link rel="canonical">` uses the
  live origin (`SITE`), never the preview's address, so anything that does read a preview is told
  which page to list instead.
- **Previews are never advertised.** Their sitemaps and robots.txt files are never read (only the
  root ones are), the root sitemap lists only live pages, IndexNow only submits live pages after a
  deploy, `llms.txt` only lists live pages, and the live site never links to `/preview/`.
- **Tested in CI.** An end-to-end test of a preview build checks the robots tag on its pages, and a
  unit test of the live robots.txt checks the AI crawler groups.

Sources: [OpenAI's crawlers](https://developers.openai.com/api/docs/bots),
[Anthropic's crawlers](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler),
[Google's common crawlers](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers),
[Perplexity's crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers).

## Adopting

1. Copy the GitHub Pages preview workflows from an earlier version of `templates/` (`git show v1.0.1:templates/.github/workflows/preview.yml`) and set the build inputs if the defaults
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
5. Keep previews out of search and AI tools: emit the robots tag when `ALLOW_INDEXING` isn't
   `true`, and add the AI crawler groups to the live robots.txt
   ([above](#keeping-previews-out-of-search-and-ai-tools)).
