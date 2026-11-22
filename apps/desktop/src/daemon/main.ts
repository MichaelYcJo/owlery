// The daemon process. The app starts it detached, with Electron's Node, so it
// outlives the app; it exits by itself once no session is alive, no headless
// session is working and no window is connected. On macOS it keeps the Mac
// from idle sleep while an agent works.
import { randomBytes } from "node:crypto";
import { mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { claudeAdapter } from "./adapters/claude";
import { HookServer, paneCommands, writeHookSettings } from "./hooks";
import { Daemon } from "./daemon";
import { buildOf, readDiscovery, writeDiscovery } from "./discovery";
import { holdAwakeFor } from "./keep-awake";
import { PANE_KINDS } from "./pane-kinds";

/** The version `package.json` holds, which the build writes in place of this name (build.mjs). */
declare const OWLERY_VERSION: string;

async function main(): Promise<void> {
  const runDir = process.env.OWLERY_RUN_DIR;
  if (!runDir) {
    console.error("OWLERY_RUN_DIR is not set");
    process.exit(2);
  }
  // Owlery's own directory, readable by the user alone, holds the hook socket, the
  // settings file passed to `claude`, the discovery file, the repositories with their work items, the last look, the choice of when to keep the Mac awake and the rules files of role sessions.
  // ~/.claude is never written.
  mkdirSync(runDir, { recursive: true, mode: 0o700 });
  const token = randomBytes(32).toString("hex");
  // The build of the script this process runs, taken once, before the daemon listens. The app compares it with the script it would start.
  const build = process.argv[1] === undefined ? undefined : buildOf(process.argv[1]);
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
    // The repositories with their work items, the last look and the choice of when to keep the Mac awake sit beside the discovery file, and outlive this process.
    runDir,
    // The workflow a setup of the records place writes fetches the pull request check at this version's tag.
    version: OWLERY_VERSION,
    // The hold is a program of macOS, and watches this process so that it ends when the daemon ends, however it ends. On another platform the daemon holds nothing.
    holdAwake: process.platform === "darwin" ? holdAwakeFor(process.pid) : undefined,
    // The kinds a client may open; `commandFor` gives each its command.
    paneKinds: PANE_KINDS,
    commandFor: paneCommands(process.env, hookSettingsFile, hooks.socketPath),
    // Every headless session is the user's own CLI, found once through their login shell. A role session loads the
    // role bundle the build put beside this script, and its rules file is written into the run folder.
    roleAdapter: claudeAdapter(process.env, { bundleDir: process.argv[1] === undefined ? undefined : join(dirname(process.argv[1]), "bundle"), rulesDir: join(runDir, "roles") }),
    onIdle: () => void stop(0),
  });
  hooks.onEvent(({ paneId, name, payload }) => {
    // Event and field names only: a hook's values carry the person's prompts.
    if (process.env.OWLERY_DEBUG_HOOKS === "1") console.log(`hook pane=${paneId} ${name} ${Object.keys(payload).sort().join(",")}`);
    daemon.agentEvent(paneId, name, payload);
  });

  const port = await daemon.listen(0);
  writeDiscovery(runDir, { port, token, pid: process.pid, build });
  console.log(`owlery daemon ${process.pid} listening on 127.0.0.1:${port}`);
  process.on("SIGTERM", () => void stop(0));
  process.on("SIGINT", () => void stop(0));
}

main().catch((error: unknown) => {
  // The message alone, in one line: the app shows the log's last line to the person as why the daemon did not start.
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
