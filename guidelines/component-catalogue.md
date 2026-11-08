# Component catalogues

A component catalogue shows every component on its own, with the site's styles and real content.
It's where a component is reviewed, and where it's tested in isolation: an accessibility audit and
a screenshot per component, so a failure names the component rather than the page it sits on.

The reference implementation is [portfolio](https://github.com/Craga89/portfolio)'s, at
[`/storybook/`](https://craigthompson.dev/storybook/) (`src/stories/`).

## Choosing the tool

| Project                        | Tool                                             | Why                                                                                                                              |
| ------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Astro site                     | [Astrobook](https://github.com/ocavue/astrobook) | Renders `.astro` components natively, as an Astro integration, so it builds with the site. Stories use Storybook's format (CSF). |
| Vite app (React, Vue, Svelte…) | [Storybook](https://storybook.js.org)            | Official renderers for these frameworks, and its add-ons (accessibility, interactions, visual tests).                            |

Storybook has no official Astro renderer (as of November 2026; a community renderer exists, but it
trails Storybook's releases), so don't use it for `.astro` components. Astrobook implements only a
subset of CSF: `args` are passed as props, there are no slots, and `decorators` go on each story,
not the default export.

## Setting it up (Astro)

- **Stories in `src/stories/`**, one `<Name>.stories.ts` per component, grouped in folders as the
  components are.
- **Built into the site** at `/storybook/` (`astrobook({ directory: 'src/stories', subpath:
  '/storybook' })`), with the site's global styles (`css: [...]`) and a `head` component for anything
  else the components need.
- **Out of search engines:** `<meta name="robots" content="noindex, nofollow">` in the head
  component, and filtered out of the sitemap (`!page.includes('/storybook/')`).
- **The site's scripts, not its analytics:** load the modules components rely on (copy buttons,
  popovers, the clock), not the page's boot script, so the catalogue counts no visits.
- **Whole-page loads between stories.** Astrobook moves between stories with Astro's ClientRouter,
  which swaps the page in place, so module scripts (the site's and each example's) don't run again
  for the next story. Mark each link `data-astro-reload` from a capture-phase click handler in the
  head component. Astrobook keeps its sidebar's scroll, search and open folders across loads.
- **A pause control** for components that animate continuously (WCAG 2.2.2): add the site's
  "pause animations" switch to every story page.
- **Keyboard access:** Astrobook's `<main>` scrolls on the dashboard, so give it `tabindex="0"` and
  a label (WCAG 2.1.1), and let a story's own page (no sidebar) scroll as a whole page, which
  full-page screenshots also need.

## Content-Security-Policy

Astro's per-page CSP hashes the site's own inline code, not Astrobook's. Don't add
`'unsafe-inline'` to `script-src`: an HTML-injection bug in any component rendered in the catalogue
could then run script on the site's origin.

- **Scripts:** after the build, add the hash of each catalogue page's own inline scripts to that
  page's `script-src`, so scripts stay hash-only
  ([`tools/lib/catalogue.mjs`](https://github.com/Craga89/portfolio/blob/main/tools/lib/catalogue.mjs)).
- **Styles:** Astrobook's UI sets style attributes, which hashes can't cover, so catalogue pages
  need `'unsafe-inline'` in `style-src`, with their style hashes removed (a browser ignores
  `'unsafe-inline'` next to a hash). Leave every other page's policy as it is.
- **Better:** serve the catalogue from its own origin (a separate Worker or Preview), so none of
  this touches the site's.

## A story for every component

- **Every component has a story**, and a unit test fails if one doesn't. The test should count what
  stories render (the component a stories file imports from `src/components/`, or the elements in
  the example it imports), not every import: a wrapper that imports a component renders nothing
  unless a story uses it.
- **Components that take content** can't get it through props alone. Show their first use in the
  site's content, copied by a script (`pnpm run stories`) into `src/stories/examples/*.mdx` and
  rendered with the content's own component mapping. Keep an item inside the components it sits in
  (a `<Row>` inside its `<Compare>`, list items inside their list), or the markup isn't valid and
  the audit fails for the wrong reason. Leave the copies out of formatting, as the content is.
- **Variants and states** a page doesn't show get stories of their own: each tone, a dialog open,
  an empty state, an error.
- **Design tokens** get stories too, read from the token stylesheet so they can't fall behind it:
  colours for each theme (including more contrast and print), with each text colour's contrast on
  the surfaces it sits on; type families; layout tokens.

## Testing every component

Tests run against the built catalogue, listing the stories from `site/storybook/stories/` so a new
story is picked up without a test change.

| Check                                   | Where                             | Notes                                                                                                                                    |
| --------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| axe, every WCAG 2.x A/AA rule           | `tests/a11y/catalogue.spec.mjs`   | Each story, in both themes, with animations settled first. Desktop only: the page-level suite covers phones.                             |
| Screenshot against an approved baseline | `tests/visual/catalogue.spec.mjs` | Each story, full page, in both themes. A story with no baseline is skipped, not failed, until a `[visual]` commit on `main` approves it. |
| Text contrast in the tokens             | `tests/unit/…/tokens.test.mjs`    | Every text colour on every surface, in every theme, at 4.5:1 or more (WCAG 1.4.3).                                                       |

The first run of these in portfolio ([portfolio#47](https://github.com/Craga89/portfolio/pull/47)) found a colour token at 4.497:1, child components rendered as
invalid markup on their own, and a scroll region with no keyboard access: things the page-level
suite had passed.

## Checklist

- [ ] Astrobook (Astro) or Storybook (Vite) installed, stories in `src/stories/`
- [ ] Built at `/storybook/`, `noindex`, out of the sitemap
- [ ] Head component loads the components' scripts, not analytics; whole-page loads between stories
- [ ] Pause control for animations; `<main>` reachable by keyboard
- [ ] `script-src` stays hash-only; inline styles allowed on catalogue pages only (or its own origin)
- [ ] A story for every component, checked by a unit test
- [ ] Content examples generated from the site's content, items inside their parents
- [ ] Token stories, and a contrast test over the tokens
- [ ] axe and screenshots for every story, in both themes
