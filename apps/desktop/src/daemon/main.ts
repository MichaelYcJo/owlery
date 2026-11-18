// The daemon process. The app starts it detached, with Electron's Node, so it
// outlives the app; it exits by itself once no session is alive and no window
// is connected.
import { randomBytes } from "node:crypto";
import { mkdirSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { claudePaneCommand, HookServer, writeHookSettings } from "./hooks";
import { loginShell } from "./pty";
import { Daemon } from "./daemon";
import { readDiscovery, writeDiscovery } from "./discovery";

async function main(): Promise<void> {
  const runDir = process.env.OWLERY_RUN_DIR;
  if (!runDir) {
    console.error("OWLERY_RUN_DIR is not set");
    process.exit(2);
  }
  // Owlery's own directory, readable by the user alone, holds the hook socket, the
  // settings file passed to `claude` and the discovery file. ~/.claude is never written.
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
    // A pane opens in the user's home until work items give it a worktree (issue #6).
    cwd: process.env.OWLERY_CWD || homedir(),
    commandFor: (kind, id) => ({
      ...(kind === "claude" ? claudePaneCommand(process.env, hookSettingsFile) : loginShell(process.env)),
      env: { OWLERY_PANE_ID: String(id), OWLERY_HOOK_SOCKET: hooks.socketPath },
    }),
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

void main();
