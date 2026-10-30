# Types

Everything is type-checked by `tsc` in strict mode, including plain JavaScript.

- Write ESM: `.mjs` for Node tools and tests, `.js`/`.ts` in `src/`. No CommonJS.
- JavaScript with JSDoc types is fine. It's checked like TypeScript (`allowJs`, `checkJs`). Use
  `@satisfies` and `@typedef` instead of casts.
- `@craga89/standards/tsconfig/base` is the shared base: strict, `noUnusedLocals`, `NodeNext`
  modules, `noEmit`. Projects only add `include`, `lib` and `types`.
- Astro projects extend `astro/tsconfigs/strict` for `src/` and use the base for everything else.
- Prefer `unknown` to `any`, and check data from outside (files, fetches, env) at the boundary.
