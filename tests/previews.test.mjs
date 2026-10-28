import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { readPreviews, renderIndex, slug, stale } from '../lib/previews.mjs';

test('slug: readable, stable and unique per branch name', () => {
  assert.match(slug('feature/Foo_bar'), /^feature-foo-bar-[0-9a-f]{6}$/);
  assert.equal(slug('feature/foo'), slug('feature/foo'));
  assert.notEqual(slug('feature/foo'), slug('feature-foo'));
  assert.notEqual(slug('Foo'), slug('foo'));
  assert.match(slug('///'), /^branch-[0-9a-f]{6}$/);
  assert.ok(slug('x'.repeat(200)).length <= 57);
});

/** A store tree with previews for the given branches, plus a folder that isn't a preview. */
function tree(/** @type {Record<string, string>} */ branches) {
  const dir = mkdtempSync(join(tmpdir(), 'previews-'));
  for (const [branch, at] of Object.entries(branches)) {
    mkdirSync(join(dir, 'preview', slug(branch)), { recursive: true });
    writeFileSync(
      join(dir, 'preview', slug(branch), '_preview.json'),
      JSON.stringify({ branch, sha: 'a'.repeat(40), at, message: `<b>${branch}</b>` }),
    );
  }
  mkdirSync(join(dir, 'preview', 'junk'), { recursive: true });
  return dir;
}

test('readPreviews: newest first, skips folders without metadata', () => {
  const dir = tree({ old: '2026-01-01T00:00:00Z', new: '2026-02-01T00:00:00Z' });
  assert.deepEqual(
    readPreviews(dir).map((p) => p.branch),
    ['new', 'old'],
  );
  assert.deepEqual(readPreviews(join(dir, 'nothing')), []);
});

test('stale: junk folders, renamed folders and gone branches', () => {
  const dir = tree({ kept: '2026-01-01T00:00:00Z', gone: '2026-01-01T00:00:00Z' });
  mkdirSync(join(dir, 'preview', 'kept-old-name'));
  writeFileSync(join(dir, 'preview', 'kept-old-name', '_preview.json'), JSON.stringify({ branch: 'kept', sha: 'b' }));
  assert.deepEqual(stale(dir, null), ['junk', 'kept-old-name']);
  assert.deepEqual(stale(dir, new Set(['kept'])), [slug('gone'), 'junk', 'kept-old-name'].sort());
  assert.ok(existsSync(join(dir, 'preview', 'junk')), 'stale() only lists');
});

test('renderIndex: links each preview and escapes what it shows', () => {
  const dir = tree({ 'feat/x': '2026-01-01T00:00:00Z' });
  const html = renderIndex(readPreviews(dir), 'https://github.com/Craga89/site');
  assert.match(html, new RegExp(`href="./${slug('feat/x')}/"`));
  assert.match(html, /&lt;b&gt;feat\/x&lt;\/b&gt;/);
  assert.match(html, /<title>Branch previews · site<\/title>/);
  assert.match(renderIndex([], 'https://github.com/a/b'), /No previews right now/);
});
