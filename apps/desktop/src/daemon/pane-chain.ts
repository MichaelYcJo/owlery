// What the daemon gives a Claude Code pane that carries the owl chain, beside
// the role bundle the build made: the head its system prompt ends with, and
// the launcher of the chain command its environment names in `OWLERY_CHAIN`.
// Both are files of Owlery's run folder, and both reach `claude` on its
// command line or in the pane's environment (`hooks.ts#paneCommands`), so no
// file of the person's Claude Code folder is written here. Which pane
// carries the chain is read at each launch: from the folder it opens in,
// and, where the pane's Claude Code enables the AgenticSeal plugin there
// under the config folder of the pane's account
// (`claude-plugins.ts#readPlugins`), from the answer the person gave for the
// repository.
import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type PluginsRead, readPlugins } from "./claude-plugins";
import type { PaneStart } from "./daemon";
import { type Carried, type PaneChain, shellQuote } from "./hooks";
import { onOwlChain } from "./records-place";
import { writeWholeFile } from "./whole-file";

/** The head's file in the run folder. */
export const HEAD_FILE = "pane-head.md";

/** The launcher's file in the run folder. It is not named `chain`: the chain command keeps what it hands a session under the folder `chain/` there (`chain-command.ts#stageFolder`). */
export const LAUNCHER_FILE = "owl-chain";

/**
 * The head a pane's system prompt ends with. It says three things and no
 * rule: the session carries the owl chain, a branch takes its seal from that
 * chain before its pull request is opened or the work is called done, and
 * the bundle's document and the pane's environment say how. The steps are
 * the document's, `skills/seal/SKILL.md` of the bundle, which the session
 * opens when a branch owes its seal.
 */
export function paneHead(): string {
  return [
    "# Owlery: this session carries the owl chain",
    "",
    "This session runs in a pane of Owlery, in a repository whose installed check is Owlery's, so it carries the owl chain: the roles of Owlery's role bundle, which is loaded as the plugin `owlery` for this session alone.",
    "",
    "A branch takes its seal from the owl chain before its pull request is opened or the work is called done.",
    "",
    "The bundle's document `skills/seal/SKILL.md`, listed as the skill `owlery:seal`, says how. The chain command is the program this pane's environment names in `OWLERY_CHAIN`.",
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
 *
 * One chain seals a repository, so a pane never runs two. Where the pane's
 * Claude Code enables the AgenticSeal plugin for the folder, the pane
 * carries the owl chain only under the person's answer "the owl chain" for
 * the repository, and its launch then names `enabledPlugins` as the pane's
 * files state it with each key of that plugin set to `false`, which keeps
 * the plugin out of the session. Under the answer "the AgenticSeal plugin",
 * and while no answer is kept, the pane carries nothing. Where the plugin is
 * not enabled the answer is not read: the owl chain is the default.
 *
 * The folder and the settings are read at each call, so a branch that gains
 * or loses Owlery's workflow, and a person who turns the plugin on or off,
 * are launched by what stands then. `plugins` is the reader of the pane's
 * Claude Code settings, which takes the folder, the main checkout and the
 * config folder the start names: the folder of the pane's account, or the
 * person's own under System default, and null while the login shell has
 * given no answer of it.
 */
export function carriedIn(chain: PaneChain | undefined, plugins: (folder: string, checkout: string, configDir: string | null) => PluginsRead = readPlugins): (start: PaneStart) => Carried | null {
  return ({ folder, checkout, chosen, configDir }) => {
    if (chain === undefined || !onOwlChain(folder)) return null;
    const read = plugins(folder, checkout, configDir);
    if (read.agenticSeal.length === 0) return { chain, enabledPlugins: null };
    if (chosen !== "owlery") return null;
    return { chain, enabledPlugins: { ...read.enabled, ...Object.fromEntries(read.agenticSeal.map((key) => [key, false])) } };
  };
}
