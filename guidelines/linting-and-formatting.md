# Linting and formatting: oxlint and oxfmt

Every repo lints with oxlint and formats with oxfmt. Don't add ESLint, Prettier or Biome next to
them.

## Setup

```bash
pnpm add -D -E oxlint oxfmt github:Craga89/standards#v1
```

**`.oxlintrc.json`** extends a preset and adds only the repo's own paths:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "extends": ["./node_modules/@craga89/standards/configs/oxlint/astro.json"]
}
```

| Preset       | Adds to `base`                                                                          |
| ------------ | --------------------------------------------------------------------------------------- |
| `base.json`  | The shared rules. Use it directly for Node tools and libraries                          |
| `astro.json` | Ignores `site/` and `.astro/`; browser env in `src/`; node env in `tools/` and `tests/` |
| `vite.json`  | Ignores `dist/`; browser env in `src/`; node env in `tools/`, `tests/` and configs      |

oxlint's `extends` takes file paths only, which is why the presets are read from `node_modules`.
Overrides in the repo's own file are added to the preset's.

**`oxfmt.config.ts`** spreads the shared options, because oxfmt has no `extends`. oxfmt finds a
`.ts` config on its own (not a `.mjs` one):

```ts
import standards from '@craga89/standards/oxfmt' with { type: 'json' };

export default {
  ...standards,
  ignorePatterns: [...standards.ignorePatterns, 'site/**'],
};
```

## House style (oxfmt)

- 120-column lines, 2-space indent, LF, final newline (`.editorconfig` matches).
- Single quotes, semicolons, trailing commas everywhere.

If oxfmt accepts it, it's fine: style isn't discussed in review. To change the house style, open
a PR here.

## Lint policy (oxlint)

- `correctness` and `suspicious` are errors, `perf` is a warning.
- `eqeqeq` always, except `== null` (which checks for both null and undefined).
- `prefer-const`, no `var`, no empty blocks (an empty `catch` included), no import cycles.
- `console` is allowed: these repos have tools and scripts, not libraries.
- JSDoc tags are checked. `@satisfies` is allowed.
- Disable a rule on one line, with the reason:
  `// oxlint-disable-next-line rule-name -- why`.
