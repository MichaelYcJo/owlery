// The daemon process. The app starts it detached, with Electron's Node, so it
// outlives the app; it exits by itself once no session is alive, no headless
// session is working and no window is connected. On macOS it keeps the Mac
// from idle sleep while an agent works, and its display awake while a heavy
// command holds a turn on the machine. It writes a line to its log when it
// stops, and one when it starts where the daemon before it ended without
// stopping (./stop-record).
import { randomBytes } from "node:crypto";
import { mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { claudeAdapter } from "./adapters/claude";
import { HookServer, paneCommands, setupPaneCommand, writeHookSettings } from "./hooks";
import { carriedIn, writePaneChain, writeRunner } from "./pane-chain";
import { Daemon } from "./daemon";
import { buildOf, readDiscovery, readyOf, writeDiscovery } from "./discovery";
import { holdAwakeFor, wakeDisplayFor } from "./keep-awake";
import { type MachineReader, readMachine, turnReading } from "./machine";
import { endedLine, recordErrors, type StopCause, stopRecord } from "./stop-record";
import { TURN_SOCKET, TurnServer } from "./turn-socket";
import { worktreesRoot } from "./worktrees";
import { PANE_KINDS } from "./pane-kinds";
import { loadWorkflow } from "./workflow";

/** The version `package.json` holds, which the build writes in place of this name (build.mjs). */
declare const OWLERY_VERSION: string;

async function main(): Promise<void> {
  const runDir = process.env.OWLERY_RUN_DIR;
  if (!runDir) {
    console.error("OWLERY_RUN_DIR is not set");
    process.exit(2);
  }
  // The machine is read once here, before anything is made, and a reading `OWLERY_MACHINE` holds that is none stops the start.
  let machine: MachineReader;
  try {
    machine = readMachine(process.env);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }
  // The role bundle the build put beside this script holds the workflow each role session and a pane's chain read their stages from. It is
  // loaded once here, before anything is made, so a file the loader refuses stops the start with the file and the key named; each launch
  // reads it again, as it reads the bundle's documents (./workflow).
  if (process.argv[1] !== undefined) loadWorkflow(join(dirname(process.argv[1]), "bundle"));
  // Owlery's own directory, readable by the user alone, holds the hook socket, the
  // settings file passed to `claude`, the discovery file, the repositories with their work items, the last look, the choice of when to keep the Mac awake, the caps a person set on the machine, the times each block of a work item's record was first read at, the cost ledger, the rules files of role sessions, the head and the chain command's launcher of a pane that carries the owl chain, the runner of heavy commands that a shell, a Claude Code pane and a worktree setup pane name and the turn socket it asks on, and under `chain/` what the chain command hands a pane's session.
  // ~/.claude is never written.
  mkdirSync(runDir, { recursive: true, mode: 0o700 });
  const token = randomBytes(32).toString("hex");
  // The build of the script this process runs, taken once, before the daemon listens. The app compares it with the script it would start.
  const build = process.argv[1] === undefined ? undefined : buildOf(process.argv[1]);
  const hookSettingsFile = writeHookSettings(runDir);
  // The build put the role bundle and the chain command beside this script. The launcher runs the command with the Node this process runs on, which is Electron's.
  const beside = process.argv[1] === undefined ? undefined : dirname(process.argv[1]);
  const carried = beside === undefined ? undefined : writePaneChain(runDir, { node: process.execPath, script: join(beside, "chain.js"), bundleDir: join(beside, "bundle") });
  // The runner of heavy commands, which the environment of a shell, a Claude Code pane and a worktree setup pane names in OWLERY_RUN, and a sign-in pane's does not, runs the chain command's `run` the same way.
  const runner = beside === undefined ? null : writeRunner(runDir, { node: process.execPath, script: join(beside, "chain.js") });
  const hooks = await HookServer.listen(join(runDir, "hooks.sock"));

  let turns: TurnServer | undefined;
  let stopping = false;
  // The line of the stop, written once, to the log, with the panes and the agents the daemon held when it began to stop (./stop-record).
  const record = stopRecord((line) => console.log(line), () => daemon.stopCounts());
  const stop = async (code: number, cause: StopCause): Promise<void> => {
    if (stopping) return;
    stopping = true;
    // Before anything is ended, so the counts are of what the stop ends.
    record(cause);
    // The discovery file is removed only while it still names this process.
    if (readDiscovery(runDir)?.pid === process.pid) rmSync(join(runDir, "daemon.json"), { force: true });
    // A command that waits for its turn runs at once once the socket is gone.
    await turns?.close();
    await daemon.close();
    await hooks.close();
    process.exit(code);
  };

  const daemon = new Daemon({
    token,
    // The repositories with their work items, the last look, the choice of when to keep the Mac awake, the caps a person set on the machine, the times each block of a work item's record was first read at, the cost ledger and the runs of heavy commands sit beside the discovery file, and outlive this process.
    runDir,
    // The workflow a setup of the records place writes fetches the pull request check at this version's tag.
    version: OWLERY_VERSION,
    // The hold is a program of macOS, and watches this process so that it ends when the daemon ends, however it ends. On another platform the daemon holds nothing.
    holdAwake: process.platform === "darwin" ? holdAwakeFor(process.pid) : undefined,
    // A heavy command's start turns the display on, through the same program.
    wakeDisplay: process.platform === "darwin" ? wakeDisplayFor() : undefined,
    // The machine's memory, cores and disk, from which the daemon proposes its caps, or the reading `OWLERY_MACHINE` holds in their place.
    machine,
    // The cores and the load the turns on the machine read, from the same reader, so a broad gate that failed while the machine was over its load runs once more.
    ...turnReading(machine, worktreesRoot(process.env)),
    // The kinds a client may open; `commandFor` gives each its command.
    paneKinds: PANE_KINDS,
    // A Claude Code pane carries the owl chain where the folder it opens in holds Owlery's workflow, read at each launch.
    commandFor: paneCommands(process.env, hookSettingsFile, hooks.socketPath, carriedIn(carried), runner),
    // A setup pane's environment names the runner too, so a repository's setup can wait its turn.
    setupCommandFor: (text, id) => setupPaneCommand(process.env, text, id, runner),
    // Every headless session is the user's own CLI, found once through their login shell. A role session loads the
    // role bundle the build put beside this script, and its rules file is written into the run folder.
    roleAdapter: claudeAdapter(process.env, { bundleDir: beside === undefined ? undefined : join(beside, "bundle"), rulesDir: join(runDir, "roles") }),
    onIdle: () => void stop(0, "idle"),
  });
  // An error of the daemon's own code that nothing caught writes the stop's line before the process ends as it would have.
  recordErrors(process, record);
  // Each command a session runs through the runner, and each gate a pane's chain runs, asks the daemon's keeper for its turn on this socket, and a pane's chain command tells the daemon there the stage its session runs and when that stage ended.
  turns = await TurnServer.listen(join(runDir, TURN_SOCKET), daemon.turnGiver(), (line) => daemon.stageTold(line));
  hooks.onEvent(({ paneId, name, payload }) => {
    // Event and field names only: a hook's values carry the person's prompts.
    if (process.env.OWLERY_DEBUG_HOOKS === "1") console.log(`hook pane=${paneId} ${name} ${Object.keys(payload).sort().join(",")}`);
    daemon.agentEvent(paneId, name, payload);
  });

  const port = await daemon.listen(0);
  // A `daemon.json` that still stands names a daemon that did not remove it: one that was killed, crashed or lost its Mac's power, where no daemon answers at its address with its token.
  const standing = readDiscovery(runDir);
  if (standing && standing.pid !== process.pid && (await readyOf(standing)) === undefined) console.log(endedLine(process.pid, new Date(), standing.pid));
  writeDiscovery(runDir, { port, token, pid: process.pid, build });
  console.log(`owlery daemon ${process.pid} listening on 127.0.0.1:${port}`);
  process.on("SIGTERM", () => void stop(0, "signal SIGTERM"));
  process.on("SIGINT", () => void stop(0, "signal SIGINT"));
}

main().catch((error: unknown) => {
  // The message alone, in one line: the app shows the log's last line to the person as why the daemon did not start.
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
