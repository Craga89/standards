// Runs pages-store/store.sh against a local bare repository standing in for GitHub.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { slug } from '../lib/previews.mjs';

const script = fileURLToPath(new URL('../pages-store/store.sh', import.meta.url));
const tmp = mkdtempSync(join(tmpdir(), 'pages-store-'));
const git = (/** @type {string} */ cwd, /** @type {string[]} */ ...args) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1' } }).trim();

const origin = join(tmp, 'origin.git');
const clone = join(tmp, 'clone');
git(tmp, 'init', '-q', '--bare', '-b', 'main', origin);
git(tmp, 'clone', '-q', origin, clone);
git(clone, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 'first');
git(clone, 'push', '-q', 'origin', 'HEAD:main', 'HEAD:feat/a', 'HEAD:feat/b');
const sha = git(clone, 'rev-parse', 'HEAD');

function site(/** @type {string} */ name, /** @type {string} */ body) {
  const dir = join(tmp, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), `<p data-commit="__BUILD_SHA__">${body}</p>`);
  return dir;
}

function store(/** @type {Record<string, string>} */ env) {
  execFileSync('bash', [script], {
    cwd: clone,
    encoding: 'utf8',
    env: {
      ...process.env,
      GITHUB_SERVER_URL: 'https://github.com',
      GITHUB_REPOSITORY: 'Craga89/site',
      TARGET: '',
      SOURCE: '',
      REMOVE: 'false',
      BRANCH: '',
      SHA: sha,
      URL: '',
      STORE_BRANCH: 'pages',
      STAMP: 'true',
      ...env,
    },
  });
}

const files = () =>
  git(origin, 'ls-tree', '-r', '--name-only', 'pages')
    .split('\n')
    .filter((f) => !f.endsWith('_preview.json'));
const show = (/** @type {string} */ path) => git(origin, 'show', `pages:${path}`);

test('previews and the live site never replace each other', () => {
  const a = `preview/${slug('feat/a')}`;
  store({ TARGET: a, SOURCE: site('a', 'A'), BRANCH: 'feat/a', URL: 'https://x/preview/a/' });
  store({ SOURCE: site('live', 'LIVE') });
  store({ TARGET: `preview/${slug('feat/b')}`, SOURCE: site('b', 'B'), BRANCH: 'feat/b' });

  assert.deepEqual(
    files(),
    ['index.html', 'preview/index.html', `${a}/index.html`, `preview/${slug('feat/b')}/index.html`].sort(),
  );
  assert.match(show('index.html'), new RegExp(`data-commit="${sha}">LIVE`));
  assert.match(show(`${a}/index.html`), />A</);
  assert.equal(JSON.parse(show(`${a}/_preview.json`)).url, 'https://x/preview/a/');
  assert.match(show('preview/index.html'), /feat\/a[\s\S]*feat\/b|feat\/b[\s\S]*feat\/a/);
  assert.equal(git(origin, 'rev-list', '--count', 'pages'), '1', 'one commit, no history');

  // A new live site replaces the old one's files, but not the previews.
  const live2 = site('live2', 'LIVE2');
  writeFileSync(join(live2, 'new.html'), '');
  store({ SOURCE: live2 });
  assert.ok(files().includes('new.html'));
  assert.ok(files().includes(`${a}/index.html`));
});

test('removing a preview, and pruning ones whose branch is gone', () => {
  store({ TARGET: `preview/${slug('feat/a')}`, REMOVE: 'true' });
  assert.ok(!files().some((f) => f.startsWith(`preview/${slug('feat/a')}/`)));

  git(clone, 'push', '-q', 'origin', ':feat/b');
  store({ SOURCE: site('live3', 'LIVE3') });
  assert.deepEqual(files(), ['index.html', 'preview/index.html']);
  assert.match(readFileSync(join(tmp, 'live3', 'index.html'), 'utf8'), new RegExp(sha));
});

test('refuses a target outside preview/', () => {
  assert.throws(() => store({ TARGET: 'preview/../x', SOURCE: site('bad', '') }));
  assert.throws(() => store({ TARGET: 'other/x', SOURCE: site('bad', '') }));
});
