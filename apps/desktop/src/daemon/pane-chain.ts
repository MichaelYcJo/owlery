// What the daemon gives a Claude Code pane that carries the owl chain, beside
// the role bundle the build made: the head its system prompt ends with, and
// the launcher of the chain command its environment names in `OWLERY_CHAIN`.
// Beside them stands the runner's launcher, which the environment of a shell,
// a Claude Code pane and a worktree setup pane names in `OWLERY_RUN`, and a
// sign-in pane's does not. Each is a file of Owlery's run folder, and each
// reaches a pane on `claude`'s command line or in the pane's environment
// (`hooks.ts#paneCommands`), so no file of the person's Claude Code folder
// is written here. Which pane
// carries the chain is read at each launch, from the folder it opens in,
// and no setting of the person's is read for it.
import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { PaneStart } from "./daemon";
import { type PaneChain, shellQuote } from "./hooks";
import { onOwlChain } from "./records-place";
import { writeWholeFile } from "./whole-file";

/** The head's file in the run folder. */
export const HEAD_FILE = "pane-head.md";

/** The launcher's file in the run folder. It is not named `chain`: the chain command keeps what it hands a session under the folder `chain/` there (`chain-command.ts#stageFolder`). */
export const LAUNCHER_FILE = "owl-chain";

/** The runner's launcher in the run folder, which the environment of a shell, a Claude Code pane and a worktree setup pane names in `OWLERY_RUN` (`hooks.ts#paneCommands`, `hooks.ts#setupPaneCommand`); a sign-in pane's names none. */
export const RUNNER_FILE = "owl-run";

/**
 * The head a pane's system prompt ends with. It says three things and no
 * rule: the session carries the Owl Chain, a branch is cleared by its
 * inspection before its pull request is opened or the work is called done,
 * and the bundle's document and the pane's environment say how. The steps
 * are the document's, `skills/inspection/SKILL.md` of the bundle, which the
 * session opens when a branch owes its inspection.
 */
export function paneHead(): string {
  return [
    "# Owlery: this session carries the Owl Chain",
    "",
    "This session runs in a pane of Owlery, in a repository whose installed check is Owlery's, so it carries the Owl Chain: the roles of Owlery's role bundle, which is loaded as the plugin `owlery` for this session alone.",
    "",
    "A branch is cleared by the Owl Chain's inspection before its pull request is opened or the work is called done.",
    "",
    "The bundle's document `skills/inspection/SKILL.md`, listed as the skill `owlery:inspection`, says how. The chain command is the program this pane's environment names in `OWLERY_CHAIN`.",
    "",
  ].join("\n");
}

/**
 * The launcher's text: a script that replaces itself with the chain
 * command's script, run by the Node the daemon runs on. That Node is
 * Electron's, which runs a script only with `ELECTRON_RUN_AS_NODE` set, and
 * a pane's environment holds no such variable (`pty.ts#terminalEnv`), so the
 * launcher sets it for that one process.
 */
function launcherText(node: string, script: string): string {
  return ["#!/bin/sh", "# Owlery's chain command, which a pane's session runs for the owl chain. The daemon writes this file at each start.", `ELECTRON_RUN_AS_NODE=1 exec ${shellQuote(node)} ${shellQuote(script)} "$@"`, ""].join("\n");
}

/**
 * Writes the runner's launcher into the run folder, over what an earlier
 * daemon left there, and gives its path. The launcher runs the chain
 * command's `run` (`chain-command.ts#run`) as `launcherText` runs the
 * command, and names the run folder in `OWLERY_RUN_DIR` for it, so the
 * runner finds the daemon's turn socket from a session outside a pane too.
 */
export function writeRunner(dir: string, built: { node: string; script: string }): string {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const runner = join(dir, RUNNER_FILE);
  const text = ["#!/bin/sh", "# Owlery's runner of heavy commands, which runs a command the repository names in its turn on the machine. The daemon writes this file at each start.", `OWLERY_RUN_DIR=${shellQuote(dir)} ELECTRON_RUN_AS_NODE=1 exec ${shellQuote(built.node)} ${shellQuote(built.script)} run "$@"`, ""].join("\n");
  writeFileSync(runner, text, { mode: 0o700 });
  // The mode of a write holds only for a file the write made.
  chmodSync(runner, 0o700);
  return runner;
}

/**
 * Writes the pane's head and the chain command's launcher into the run
 * folder, over what an earlier daemon left there, and gives what a pane that
 * carries the chain is launched with. `built` names the Node the launcher
 * runs the command with, the command's script and the role bundle's folder.
 */
export function writePaneChain(dir: string, built: { node: string; script: string; bundleDir: string }): PaneChain {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const headFile = join(dir, HEAD_FILE);
  const launcher = join(dir, LAUNCHER_FILE);
  writeWholeFile(headFile, paneHead());
  writeFileSync(launcher, launcherText(built.node, built.script), { mode: 0o700 });
  // The mode of a write holds only for a file the write made.
  chmodSync(launcher, 0o700);
  return { bundleDir: built.bundleDir, headFile, launcher };
}

/**
 * What a Claude Code pane of a start carries: the chain where the folder it
 * opens in is on the owl chain (`records-place.ts#onOwlChain`), and nothing
 * in every other folder, or where the daemon was given no chain to hand out.
 * The folder is read at each call, so a branch that gains or loses Owlery's
 * workflow is launched by what stands then. Nothing of the person's Claude
 * Code settings is read: a plugin they enable loads beside the bundle.
 */
export function carriedIn(chain: PaneChain | undefined): (start: PaneStart) => PaneChain | null {
  return ({ folder }) => (chain !== undefined && onOwlChain(folder) ? chain : null);
}
