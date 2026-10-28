# TypeScript

- All new code is TypeScript with `strict: true`. Extend a shared tsconfig:

  ```json
  { "extends": "@craga89/standards/tsconfig/vite-react" }
  ```

  | Config       | Use for                    |
  | ------------ | -------------------------- |
  | `base`       | Anything bundled (default) |
  | `vite-react` | Vite + React apps          |
  | `node`       | Node services / CLIs       |

  Astro projects extend `astro/tsconfigs/strict` instead.

- `noUncheckedIndexedAccess` is on. Handle the `undefined`, don't `!` it away.
- Prefer `unknown` over `any`. Narrow with type guards or a schema (Zod/Valibot) at I/O
  boundaries.
- Prefer `type` aliases for unions and object shapes. Use `interface` only when you need
  declaration merging or `extends` chains.
- ESM only (`"type": "module"`). No CommonJS in new packages.
- No enums. Use `as const` objects or string literal unions.
- Named exports over default exports, except where a framework requires defaults (Astro
  pages, config files).
