# Linting and formatting: oxlint + oxfmt

All repos lint with **oxlint** and format with **oxfmt**, both from the
[Oxc](https://oxc.rs) project. Don't add ESLint, Prettier or Biome alongside them. If a rule
you need only exists as an ESLint plugin, check oxlint's `jsPlugins` support before adding a
second linter.

## Setup

```bash
pnpm add -D oxlint oxfmt github:Craga89/standards#v1
```

**`.oxlintrc.json`**: extend one shared preset:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "extends": ["./node_modules/@craga89/standards/configs/oxlint/react.json"]
}
```

| Preset       | Use for                                      |
| ------------ | -------------------------------------------- |
| `base.json`  | Node services, libraries, CLIs               |
| `react.json` | Vite + React apps, React component libraries |
| `astro.json` | Astro sites                                  |

oxlint's `extends` only accepts file paths, so the presets are consumed from `node_modules`.

**`oxfmt.config.ts`**: oxfmt has no `extends`, so spread the shared options:

```ts
import standards from "@craga89/standards/oxfmt" with { type: "json" };

export default {
  ...standards,
};
```

For Astro repos, enable `.astro` formatting and install its compiler
(`pnpm add -D @astrojs/compiler-rs`):

```ts
export default {
  ...standards,
  astro: true,
};
```

## Style decisions (enforced by oxfmt)

- 2-space indent, 100-column print width, LF line endings.
- Double quotes, semicolons, trailing commas everywhere.
- Imports sorted automatically (`sortImports`), `package.json` keys sorted.

Don't argue about style in review. If oxfmt accepts it, it's fine. To change the house style,
open a PR here.

## Lint policy

- `correctness` rules are errors, `suspicious` and `perf` are warnings.
- CI fails on errors. Fix warnings when you touch the code, and don't add new ones.
- Suppress with a reason: `// oxlint-disable-next-line rule-name -- why`.
- Use `import type` for type-only imports (`typescript/consistent-type-imports`).
- Use the `node:` protocol for built-ins (`node:fs`, not `fs`).
- Prefix intentionally unused variables and arguments with `_`.

## Editor

Install the **Oxc** VS Code extension (`oxc.oxc-vscode`). It provides both lint and format via
LSP. Set it as the default formatter and enable format-on-save:

```json
{
  "editor.defaultFormatter": "oxc.oxc-vscode",
  "editor.formatOnSave": true
}
```
