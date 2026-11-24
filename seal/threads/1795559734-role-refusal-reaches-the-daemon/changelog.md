# Changelog: the role refusal hand check reaches the daemon

Issue #191. `pnpm run role:refusal` and `pnpm run role:refusal:sealer` asked a real proofer or sealer to run a shell command that changes a file. Each role's definition tells it to run no such command, so a role that held to its definition declined, no permission request reached the daemon, and the check failed while the daemon's refusal went untested.

- **The two scripts now run the real `claude` against a stand-in for the model.** The stand-in is a server on the loopback that the check starts. It answers the session's first turn with the shell command itself, so the request reaches the daemon whatever a model would choose. The CLI is still launched by the daemon with a role's arguments and the built bundle, and the daemon still answers the request by its rule.
- **The check spends none of your usage and needs no login.** It gives the CLI a placeholder key, a home folder and a Claude Code config folder of its own, so the CLI reads and writes nothing of your Claude Code folder. It still needs `pnpm install` and a `claude` your login shell finds.
- **A failure says where it stopped.** The check reads, in order, that the session holds its four tools and runs on the placeholder key, that the CLI asked the stand-in for a turn, that the request for the command reached the daemon, that the stand-in was told the daemon's reason as a failed call, that the file kept its bytes, and that no request waited for a person. It prints the CLI's version and every request the stand-in received.
- **`pnpm run role:run` is unchanged.** It is still a real session on your login and costs your usage.
- **Nothing changes in the app.** The daemon, the adapter and the role bundle are as they were.
