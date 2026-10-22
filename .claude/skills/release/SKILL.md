---
name: release
description: Release a new version of the skin plugin — checks, version bump, commit, tag, push, and how installed copies update (marketplace ilianusss). Use when asked to release, publish, bump the version or ship changes to friends.
---

# Releasing

Users install from the `ilianusss` marketplace (this repo's `.claude-plugin/marketplace.json`, plugin
source `./`). Claude Code updates a plugin when its `version` in `.claude-plugin/plugin.json` changes,
so **a release is a version bump on `main`**.

1. Checks, all green:
   ```sh
   claude plugin test .
   claude plugin validate .
   npx -y -p typescript@5.9.3 tsc -p tsconfig.json   # types laid as in AGENTS.md
   ```
2. Bump `version` in `.claude-plugin/plugin.json` (semver: patch = fix, minor = feature or new
   skin, major = a removed command or changed file format such as skin files or .theme keys).
3. FEATURES.md / README.md up to date with what changed.
4. Commit (`release: x.y.z` + a line per change), tag `vx.y.z`, push `main` and the tag — ask the
   person before pushing.
5. Users: `claude plugin marketplace update ilianusss && claude plugin update skin@ilianusss`, then
   restart; with marketplace auto-update on, Claude Code does it at startup. Open sessions keep the
   version they started with.

The plugin itself makes no network call: no update check, no telemetry.
