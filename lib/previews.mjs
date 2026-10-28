// Branch previews: every pushed branch is built into preview/<slug>/ on the Pages site, next to the
// live site. These helpers name the folders, prune the ones whose branch is gone, and write the
// preview/ index page. Used by the preview-name and pages-store actions.
//   node lib/previews.mjs slug <branch>                        prints the folder name for a branch
//   node lib/previews.mjs index <dir> <repo-url> [branches]   prunes <dir>/preview/, writes its index.html
// [branches] is a file with one existing branch per line; previews of any other branch are removed.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PREFIX = 'preview';

/**
 * @typedef {object} Preview
 * @property {string} slug The folder under preview/
 * @property {string} branch
 * @property {string} sha The commit it was built from
 * @property {string} at When it was stored (ISO 8601)
 * @property {string} [message] The commit message's first line
 * @property {string} [url] Where it's served
 */

/**
 * The folder name for a branch: a readable part (lowercase letters, digits and dashes, at most 50
 * characters) and six characters of a hash of the exact name, so branches that read the same
 * (`feature/foo` and `feature-foo`, `Foo` and `foo`) never share a folder, and one can't overwrite
 * or delete the other's preview.
 */
export const slug = (/** @type {string} */ branch) => {
  const name = String(branch);
  const readable =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 50)
      .replace(/^-+|-+$/g, '') || 'branch';
  return `${readable}-${createHash('sha256').update(name).digest('hex').slice(0, 6)}`;
};

/** The previews in `dir`/preview/, newest first. Folders without a readable _preview.json are left out. */
export function readPreviews(/** @type {string} */ dir) {
  const root = join(dir, PREFIX);
  if (!existsSync(root)) return [];
  /** @type {Preview[]} */
  const out = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    try {
      const meta = JSON.parse(readFileSync(join(root, entry.name, '_preview.json'), 'utf8'));
      if (typeof meta.branch !== 'string' || typeof meta.sha !== 'string') continue;
      out.push({ ...meta, slug: entry.name, at: String(meta.at ?? '') });
    } catch {
      continue; // not a preview (or a half-written one); it doesn't get listed
    }
  }
  return out.sort((a, b) => b.at.localeCompare(a.at) || a.slug.localeCompare(b.slug));
}

/**
 * Folders in `dir`/preview/ to remove: ones whose name isn't their branch's slug, ones without
 * metadata, and, when `branches` is given, ones whose branch no longer exists.
 * @param {string} dir
 * @param {Set<string> | null} branches
 */
export function stale(dir, branches) {
  const root = join(dir, PREFIX);
  if (!existsSync(root)) return [];
  const previews = new Map(readPreviews(dir).map((p) => [p.slug, p]));
  return readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => {
      const p = previews.get(name);
      return !p || p.slug !== slug(p.branch) || (branches !== null && !branches.has(p.branch));
    })
    .sort();
}

const esc = (/** @type {unknown} */ s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => `&${{ '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot', "'": '#39' }[c]};`);

/**
 * The preview/ index page.
 * @param {Preview[]} previews
 * @param {string} repo The repository's web address, for links to commits
 */
export function renderIndex(previews, repo) {
  const name = repo.replace(/\/+$/, '').split('/').pop();
  const rows = previews.map((p) => {
    const when = p.at
      ? `<time datetime="${esc(p.at)}">${esc(p.at.replace('T', ' ').replace(/(:\d\d)(\.\d+)?Z$/, '$1 UTC'))}</time>`
      : '';
    return `<li>
  <a class="name" href="./${esc(p.slug)}/">${esc(p.branch)}</a>
  <span class="meta"><a href="${esc(repo)}/commit/${esc(p.sha)}"><code>${esc(p.sha.slice(0, 7))}</code></a> ${when}</span>
  ${p.message ? `<span class="msg">${esc(p.message)}</span>` : ''}
</li>`;
  });
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive">
<title>Branch previews · ${esc(name)}</title>
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; font: 1rem/1.5 system-ui, sans-serif; background: Canvas; color: CanvasText; }
  main { max-width: 760px; margin: 0 auto; padding: 48px 24px; }
  h1 { margin: 0 0 4px; font-size: 1.75rem; }
  p { margin: 0 0 24px; opacity: 0.75; }
  ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 10px; }
  li { display: grid; gap: 2px; padding: 14px 18px; border: 1px solid color-mix(in srgb, CanvasText 15%, transparent); border-radius: 12px; }
  a { color: inherit; }
  .name { font-weight: 700; }
  .meta, .msg { font-size: 0.875rem; opacity: 0.75; }
  :focus-visible { outline: 3px solid currentColor; outline-offset: 3px; }
</style>
</head>
<body>
<main>
<h1>Branch previews</h1>
<p>Every pushed branch of <a href="${esc(repo)}">${esc(name)}</a>, built as soon as it's pushed (before the checks run). <a href="../">The live site</a>.</p>
${rows.length ? `<ul>\n${rows.join('\n')}\n</ul>` : '<p>No previews right now.</p>'}
</main>
</body>
</html>
`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, a, b, c] = process.argv.slice(2);
  if (cmd === 'slug' && a) {
    console.log(slug(a));
  } else if (cmd === 'index' && a && b) {
    const branches = c ? new Set(readFileSync(c, 'utf8').split('\n').filter(Boolean)) : null;
    for (const name of stale(a, branches)) {
      rmSync(join(a, PREFIX, name), { recursive: true, force: true });
      console.log(`removed ${PREFIX}/${name}/ (its branch is gone, or it's an old folder name)`);
    }
    const previews = readPreviews(a);
    mkdirSync(join(a, PREFIX), { recursive: true });
    writeFileSync(join(a, PREFIX, 'index.html'), renderIndex(previews, b));
    console.log(`${PREFIX}/index.html lists ${previews.length} preview(s)`);
  } else {
    console.error('usage: previews.mjs slug <branch> | index <dir> <repo-url> [branches-file]');
    process.exit(2);
  }
}
