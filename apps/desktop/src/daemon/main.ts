// The daemon process. The app starts it detached, with Electron's Node, so it
// outlives the app; it exits by itself once no session is alive, no headless
// session is working and no window is connected.
import { randomBytes } from "node:crypto";
import { mkdirSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { claudeAdapter } from "./adapters/claude";
import { claudePaneCommand, HookServer, writeHookSettings } from "./hooks";
import { loginShell } from "./pty";
import { Daemon } from "./daemon";
import { readDiscovery, writeDiscovery } from "./discovery";
import { PANE_KINDS } from "./pane-kinds";

async function main(): Promise<void> {
  const runDir = process.env.OWLERY_RUN_DIR;
  if (!runDir) {
    console.error("OWLERY_RUN_DIR is not set");
    process.exit(2);
  }
  // Owlery's own directory, readable by the user alone, holds the hook socket, the
  // settings file passed to `claude`, the discovery file, the repositories with their work items and the last look.
  // ~/.claude is never written.
  mkdirSync(runDir, { recursive: true, mode: 0o700 });
  const token = randomBytes(32).toString("hex");
  const hookSettingsFile = writeHookSettings(runDir);
  const hooks = await HookServer.listen(join(runDir, "hooks.sock"));

  let stopping = false;
  const stop = async (code: number): Promise<void> => {
    if (stopping) return;
    stopping = true;
    // The discovery file is removed only while it still names this process.
    if (readDiscovery(runDir)?.pid === process.pid) rmSync(join(runDir, "daemon.json"), { force: true });
    await daemon.close();
    await hooks.close();
    process.exit(code);
  };

  const daemon = new Daemon({
    token,
    // A pane opened without a work item runs in the user's home; a work item's pane runs in its worktree.
    cwd: process.env.OWLERY_CWD || homedir(),
    // The repositories with their work items and the last look sit beside the discovery file, and outlive this process.
    runDir,
    // The kinds a client may open; `commandFor` gives each its command.
    paneKinds: PANE_KINDS,
    commandFor: (kind, id) => ({
      ...(kind === "claude" ? claudePaneCommand(process.env, hookSettingsFile) : loginShell(process.env)),
      env: { OWLERY_PANE_ID: String(id), OWLERY_HOOK_SOCKET: hooks.socketPath },
    }),
    // Every headless session is the user's own CLI, found once through their login shell.
    roleAdapter: claudeAdapter(process.env),
    onIdle: () => void stop(0),
  });
  hooks.onEvent(({ paneId, name, payload }) => {
    // Event and field names only: a hook's values carry the person's prompts.
    if (process.env.OWLERY_DEBUG_HOOKS === "1") console.log(`hook pane=${paneId} ${name} ${Object.keys(payload).sort().join(",")}`);
    daemon.agentEvent(paneId, name, payload);
  });

  const port = await daemon.listen(0);
  writeDiscovery(runDir, { port, token, pid: process.pid });
  console.log(`owlery daemon ${process.pid} listening on 127.0.0.1:${port}`);
  process.on("SIGTERM", () => void stop(0));
  process.on("SIGINT", () => void stop(0));
}

main().catch((error: unknown) => {
  // The message alone, in one line: the app shows the log's last line to the person as why the daemon did not start.
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
