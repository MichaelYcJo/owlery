# Changelog: a pane no longer inherits what pnpm gave the app

Issue #87. Owlery 0.0.1 starts with `pnpm -C apps/desktop start`, and pnpm gives the app the variables of a package script. Every pane received them. nvm refuses to load while `npm_config_prefix` is set, so a pane found no `node`, and Claude Code in a pane failed each plugin hook that runs `node` ("SessionStart:startup hook failed /bin/sh: node: command not found").

- **A pane holds none of a package script's variables:** `npm_*`, `pnpm_*`, `PNPM_SCRIPT_SRC_DIR`, `INIT_CWD`, `NODE` and `NODE_PATH`. Your own `PNPM_HOME` stays.
- **A pane's `PATH` holds no folder inside a `node_modules` folder**, so a command in the pane no longer runs Owlery's own copy of a tool before yours.
- **nvm loads in a pane as it does in your terminal**, and Claude Code's `node` hooks find `node`.
- **A daemon left running from before this change keeps the old environment** for the panes it starts, until it exits.
