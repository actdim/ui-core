# Plan: Replace catalog: dependency for i18next with semver range

## Objectives
- Replace `"i18next": "catalog:"` with `"i18next": "^24.2.3"` in `package.json`.
- Regenerate `pnpm-lock.yaml` in standalone mode.
- Verify tests and docs build pass cleanly.

## Execution Steps
1. Edit `package.json` to replace catalog dependency.
2. Run `pnpm install --ignore-workspace --lockfile-only --config.auto-install-peers=false`.
3. Run `along test` and `pnpm run docs:build`.
4. Wrap issue and commit changes.
