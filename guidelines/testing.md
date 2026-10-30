# Testing

| Layer         | Tool                             | Where                      | Runs in CI                                     |
| ------------- | -------------------------------- | -------------------------- | ---------------------------------------------- |
| Unit          | `node --test`                    | `tests/unit/**/*.test.mjs` | Every change, against the build                |
| End-to-end    | Playwright                       | `tests/e2e`                | Every change, desktop and mobile               |
| Accessibility | axe via Playwright (WCAG 2.2 AA) | `tests/a11y`               | Every change, sharded; live site on a schedule |
| Performance   | Lighthouse                       | CI workflow                | After each deploy                              |
| Links         | lychee                           | CI workflow                | On a schedule                                  |

- Unit coverage is enforced by `node --test` thresholds: 95% lines, 80% branches, 90% functions,
  over the code the tests are meant to cover (`--test-coverage-include`).
- End-to-end and accessibility tests run against the built site (`site/`), not the dev server, at
  the base path it will be served from (`SITE_BASE`).
- Reports (accessibility, Lighthouse) are published to their own branches with `publish-branch`
  and `report-meta`, so a site can show its latest results.
