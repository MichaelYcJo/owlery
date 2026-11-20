Part of #90. The issue closes when `release/v0.0.1` reaches `main`.

- The login shell that finds the user's `claude` starts with a pane's environment, so the `PATH` a headless session receives keeps nvm's `node` when pnpm started the app
  `seal/threads/1795132877-headless-lookup-env/changelog.md`, the first and second bullets
- With `npm_config_prefix` set the lookup's own script printed a `PATH` without nvm, and without the variable it printed two nvm folders
  `seal/threads/1795132877-headless-lookup-env/gaps.md` *Not verified*, row 2

🤖 Generated with [Claude Code](https://claude.com/claude-code)
