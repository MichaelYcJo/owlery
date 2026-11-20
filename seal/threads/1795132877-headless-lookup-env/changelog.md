# Changelog: a headless Claude session no longer loses your node to pnpm

Issue #90. Owlery 0.0.1 starts with `pnpm -C apps/desktop start`. Owlery finds your `claude` for a headless session by asking your login shell, and it asked that shell with the variables pnpm gave the app. nvm refuses to load while `npm_config_prefix` is set, so the `PATH` the session received had no `node` and began with Owlery's own `node_modules/.bin`.

- **Owlery asks your login shell where `claude` is with the environment a terminal pane gets**, without the variables a package script or Electron gave the app, and without `node_modules` folders in `PATH`.
- **A headless session's `PATH` is the one your terminal has**, so a command it runs finds your `node`.
- **A daemon left running from before this change keeps the old answer** until it exits, because it asks the login shell once.
