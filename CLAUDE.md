# Working in Craga89/standards

This repo is the source of truth for shared tooling and guidelines. Other repos consume it
in three ways, so changes here can break them:

1. **GitHub Actions**: `uses: Craga89/standards/.github/...@v1`. The `v1` tag is moved
   forward on each non-breaking release. Breaking changes (renamed inputs, removed steps)
   need a new major tag (`v2`).
2. **Config files**: installed as `github:Craga89/standards#v1` and referenced from
   `node_modules/@craga89/standards/configs/...`. Don't rename or move files under
   `configs/`, and keep the `exports` map in `package.json` in sync.
3. **Docs**: `docs/guidelines/*.md` are linked from consuming repos' `AGENTS.md`.

Before committing: `pnpm format && pnpm lint`. Workflows are checked by actionlint in CI.
