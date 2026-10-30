// The published package: what it ships, and that it can be a pnpm config dependency.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('a config dependency can have no dependencies of its own', () => {
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.peerDependencies, undefined);
  assert.equal(pkg.scripts?.postinstall ?? pkg.scripts?.install ?? pkg.scripts?.preinstall, undefined);
});

test('every export is a file the package ships', () => {
  const packed = JSON.parse(execFileSync('pnpm', ['pack', '--dry-run', '--json'], { cwd: root, encoding: 'utf8' }));
  const files = new Set(packed.files.map((f) => f.path));
  for (const [key, target] of Object.entries(pkg.exports)) {
    if (!target.includes('*')) {
      assert.ok(files.has(target.replace(/^\.\//, '')), `${key} -> ${target}`);
      continue;
    }
    const [dir, ext] = target.replace(/^\.\//, '').split('*');
    assert.ok(
      [...files].some((f) => f.startsWith(dir) && f.endsWith(ext)),
      `${key} -> ${target} matches a file`,
    );
  }
  assert.ok(![...files].some((f) => /^(tests|github|guidelines|templates|\.github)\//.test(f)), 'ships only configs');
});
