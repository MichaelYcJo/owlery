// What the pane's Claude Code enables of plugins, and whether one of them is
// the AgenticSeal plugin: a second chain, which would run beside the owl
// chain in a pane that carries it (`pane-chain.ts#carriedIn`). The settings
// files and the list of installed plugins are the person's own. They are
// read at each call and nothing here writes one.
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { PLUGIN_CHECK } from "./records-place";

/** What the settings files enable, and which of the enabled keys are the AgenticSeal plugin's. */
export interface PluginsRead {
  /** `enabledPlugins` of the three settings files as one object, the later file's value standing for a key two of them state, each value as its file states it. */
  enabled: Record<string, unknown>;
  /** The keys of `enabled` that are enabled and whose plugin is AgenticSeal's, in the order `enabled` holds them. */
  agenticSeal: string[];
}

/**
 * The Claude Code config folder of an environment: the one
 * `CLAUDE_CONFIG_DIR` names, which Claude Code itself reads there, and
 * `.claude` of the person's home otherwise. The reader takes the daemon's
 * own only while the person's login shell has given no answer of its
 * folder: a pane's `claude` reads the folder its login shell names, which
 * is another than the daemon's where the profile exports one the daemon's
 * environment does not hold.
 */
export function claudeConfigDir(env: NodeJS.ProcessEnv = process.env): string {
  return env.CLAUDE_CONFIG_DIR || join(env.HOME || homedir(), ".claude");
}

/** The JSON object a file holds, or null where no file stands there, it cannot be read, or it holds no JSON object. */
function objectIn(file: string): Record<string, unknown> | null {
  try {
    const value = JSON.parse(readFileSync(file, "utf8")) as unknown;
    return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** `enabledPlugins` of a settings file, or no key where the file states none as an object. */
function enabledIn(file: string): Record<string, unknown> {
  const stated = objectIn(file)?.enabledPlugins;
  return typeof stated === "object" && stated !== null && !Array.isArray(stated) ? (stated as Record<string, unknown>) : {};
}

/**
 * Reads what Claude Code enables of plugins for a session in `folder`, a
 * worktree of the repository whose main checkout is `checkout`, under the
 * config folder `configDir`, and under the folder of the daemon's own
 * environment (`claudeConfigDir`) where it is null. Three files state it, and a later one wins for
 * a key two of them state: `settings.json` of the config folder,
 * `.claude/settings.json` of the folder, and `.claude/settings.local.json`
 * of the main checkout, which is the local file of each of its worktrees.
 *
 * A key is read as enabled unless its value is `false`. An enabled key is
 * AgenticSeal's where `plugins/installed_plugins.json` of the config folder
 * gives it an install folder that holds the script AgenticSeal's check runs,
 * which is how `records-place.ts` tells AgenticSeal's workflow. A plugin is
 * told by that script and not by its name, since a marketplace may name it
 * otherwise. A file that does not stand or holds no JSON object states
 * nothing.
 */
export function readPlugins(folder: string, checkout: string, configDir: string | null = null): PluginsRead {
  const config = configDir ?? claudeConfigDir();
  const enabled = { ...enabledIn(join(config, "settings.json")), ...enabledIn(join(folder, ".claude", "settings.json")), ...enabledIn(join(checkout, ".claude", "settings.local.json")) };
  const on = Object.keys(enabled).filter((key) => enabled[key] !== false);
  if (on.length === 0) return { enabled, agenticSeal: [] };
  const installed = objectIn(join(config, "plugins", "installed_plugins.json"))?.plugins;
  const entries = (key: string): unknown[] => {
    const listed = typeof installed === "object" && installed !== null ? (installed as Record<string, unknown>)[key] : undefined;
    return Array.isArray(listed) ? listed : [];
  };
  const holdsCheck = (entry: unknown): boolean => {
    const path = typeof entry === "object" && entry !== null ? (entry as { installPath?: unknown }).installPath : undefined;
    return typeof path === "string" && existsSync(join(path, PLUGIN_CHECK));
  };
  return { enabled, agenticSeal: on.filter((key) => entries(key).some(holdsCheck)) };
}
