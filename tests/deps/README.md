# Dependency tests

`npm run test:deps` runs this directory only. Each file covers one load-bearing
dependency and asserts the specific ways **this codebase** uses it, not the
library in general. The suite needs the docker-compose Postgres and Redis and
nothing else: no ngrok, no webhook server, no third-party APIs, no
`test_credentials.json`. It should finish in well under a minute.

## When to run it

- Any dependency bump (Dependabot or manual). Run it instead of the full suite.
- Small code changes that touch how a library is called.

The full suite (`npm test`) is for new features and large refactors. It is slow
and flaky because it hits live CRMs.

## When to extend it

When a dependency gets a **major** bump, read its changelog and add or extend
its file here with whatever changed that we rely on. Examples of what belongs:

- an API we call whose signature changed (tRPC 11.18 made `batchIndex` required
  on direct procedure calls);
- a removed export we import (lucide 1.0 dropped brand icons; @sanity/image-url
  2 moved `SanityImageSource`);
- a changed default we depend on (ioredis 6 switched to RESP3).

Keep each test tied to a real call site in `src/`. If nothing in `src/` uses a
feature, don't test it here.

## Not covered

- **next**, **react**, **mapbox-gl**, **react-map-gl**, **sanity**: browser or
  build-time. `next build` and opening the app on a preview are the tests.
- **Third-party CRM SDKs** are only checked for client shape (construction and
  method presence). Live behaviour stays in `tests/unit/server/adaptors`.
