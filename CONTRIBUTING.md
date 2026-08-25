# Contributing

Set up as the [README](README.md) describes. `yarn install` also installs the
Husky hooks, through `postinstall`.

## Working on the code

- The pre-commit hook runs `yarn check` (Biome). The formatter is authoritative:
  tabs, double quotes, never hand-format against it.
- Run `yarn typecheck` and `yarn test` before opening a pull request. CI runs the
  same checks.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org).

## Tests

`yarn test`, or `yarn test:watch` while working. Nothing to set up: the suite
carries its own committed `.env.test`.

| Layer | Where | What it covers |
| --- | --- | --- |
| Unit | `*.test.ts` next to the file it tests | a service against a fake port, an adapter against its algorithm |
| End to end | `tests/e2e`, one file per endpoint | the assembled application through the API |
