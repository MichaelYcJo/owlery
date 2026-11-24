// The choice of a chain in the built app: a repository on the owl chain
// whose Claude Code enables the AgenticSeal plugin is asked about once,
// before its first Claude Code pane opens, the daemon keeps the answer and
// launches each pane by it, and the repository's settings show and change
// it. No `claude` runs: the panes' process is a stand-in for the shell that
// writes the command it was given. The Claude Code config folder is one of
// the cases' own, so nothing is read from the person's.
// One start of the app serves every case, so the cases run in the order
// they stand in.
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hookSettings } from "../src/daemon/hooks";
import { MARKER } from "../src/daemon/records-place";
import { BuiltApp, buildApp } from "./built-app";
import { git, temporaryRepository } from "./repositories";

const KEY = "agentic@agenticseal";
const DIST = join(__dirname, "..", "dist");

describe("the choice of a chain in the built app", { timeout: 30_000 }, () => {
  let app: BuiltApp;
  let made: ReturnType<typeof temporaryRepository>;
  let config: string;
  /** The file the stand-in writes each Claude Code pane's command to, a line each. */
  let launched: string;
  /** What the person's config folder held before the app started. */
  let before: unknown[];

  const held = (): unknown[] =>
    (readdirSync(config, { recursive: true, withFileTypes: true }) as { name: string; parentPath: string; isFile(): boolean }[])
      .map((entry) => [join(entry.parentPath, entry.name), entry.isFile() ? readFileSync(join(entry.parentPath, entry.name), "base64") : null])
      .sort();
  const runDir = (): string => join(app.userData, "run");
  const value = <T>(expression: string): Promise<T> => app.evaluate<T>(expression);
  const open = (id: string): Promise<boolean> => value(`document.getElementById(${JSON.stringify(id)}).open`);
  const dialogOpen = (id: string): Promise<void> => app.until(`document.getElementById(${JSON.stringify(id)}).open`, `the dialog ${id}`);
  const dialogClosed = (id: string): Promise<void> => app.until(`!document.getElementById(${JSON.stringify(id)}).open`, `the dialog ${id} closed`);
  /** The commands of the Claude Code panes launched so far. */
  const commands = (): string[] => (existsSync(launched) ? readFileSync(launched, "utf8").split("\n").slice(0, -1) : []);
  /** Waits for the command of the pane launched after `count` others, and gives it. */
  async function commandAfter(count: number): Promise<string> {
    const deadline = Date.now() + 15_000;
    while (commands().length <= count) {
      if (Date.now() >= deadline) throw new Error(`no Claude Code pane was launched after ${String(count)}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return commands()[count]!;
  }
  /** Presses the pane bar's button that says `text`. */
  async function pressPaneButton(text: string): Promise<void> {
    await value(`(() => { for (const button of document.querySelectorAll("#pane-buttons button")) button.toggleAttribute("data-pressed-here", button.textContent === ${JSON.stringify(text)}); })()`);
    await app.click("#pane-buttons button[data-pressed-here]");
  }
  /** Opens the settings of the one repository from its menu. */
  async function openSettings(): Promise<void> {
    await app.click("#sidebar section[data-repository] .repository-menu");
    await app.until(`document.querySelector('[role="menu"] [role="menuitem"]')`, "the repository's menu");
    await value(`(() => { for (const item of document.querySelectorAll('[role="menu"] [role="menuitem"]')) item.toggleAttribute("data-pressed-here", item.textContent === "Settings"); })()`);
    await app.click('[role="menu"] [role="menuitem"][data-pressed-here]');
    await dialogOpen("settings-dialog");
  }
  const carrying = (settings: string): string => `exec claude --settings '${settings}' --plugin-dir '${join(DIST, "bundle")}' --append-system-prompt-file '${join(runDir(), "pane-head.md")}'`;

  beforeAll(async () => {
    buildApp();
    made = temporaryRepository("chain-choice");
    // A repository on the owl chain: its checkout holds Owlery's workflow, committed, so a work item's worktree holds it. It holds a place for work records too, so its registration offers no setup of one.
    mkdirSync(join(made.repo, ".github", "workflows"), { recursive: true });
    writeFileSync(join(made.repo, ".github", "workflows", "owlery-seal.yml"), "name: Owlery seal\n");
    mkdirSync(join(made.repo, "seal"));
    writeFileSync(join(made.repo, "seal", "README.md"), `${MARKER}\n`);
    writeFileSync(join(made.repo, "seal", "config.json"), '{ "Mode": "shared", "Broad gate": "true" }\n');
    git(made.repo, "add", "--all");
    git(made.repo, "commit", "--quiet", "-m", "ci: the check");
    // The person's Claude Code enables the AgenticSeal plugin and one other, with the plugin installed where its check's script stands.
    config = join(made.base, "claude-config");
    const installed = join(config, "plugins", "cache", "agenticseal", "agentic", "1.0.0");
    mkdirSync(join(installed, "skills", "code-review", "scripts"), { recursive: true });
    writeFileSync(join(installed, "skills", "code-review", "scripts", "chain_check.py"), "# the check\n");
    writeFileSync(join(config, "settings.json"), `${JSON.stringify({ enabledPlugins: { [KEY]: true, "notes@somewhere": true } }, null, 2)}\n`);
    writeFileSync(join(config, "plugins", "installed_plugins.json"), `${JSON.stringify({ version: 2, plugins: { [KEY]: [{ scope: "user", installPath: installed, version: "1.0.0" }] } })}\n`);
    before = held();
    // Stands for the login shell and for a pane's shell. Asked for a Claude Code pane's command it notes the command and stays a moment, and asked anything else it names no CLI and ends.
    launched = join(made.base, "launched");
    const shell = join(made.base, "shell");
    writeFileSync(shell, ["#!/bin/sh", `if [ "$3" = -c ] && [ "\${4#exec claude }" != "$4" ]; then printf '%s\\n' "$4" >> '${launched}'; sleep 2; exit 0; fi`, `printf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n' '/usr/bin/false' '/usr/bin:/bin'`, ""].join("\n"));
    chmodSync(shell, 0o755);
    app = await BuiltApp.start({ SHELL: shell, OWLERY_WORKTREES: made.root, CLAUDE_CONFIG_DIR: config });
    await app.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
    await app.until(`["summary-screen", "inbox-screen", "history-screen"].some((id) => document.getElementById(id)?.hidden === false)`, "a screen in front");
    // The repository is registered first, with no work item, so the window holds what the daemon read of it.
    await app.click("#new-work-item");
    await dialogOpen("work-item-dialog");
    await app.click("#work-item-repo");
    await app.cdp("Input.insertText", { text: made.repo });
    await app.click("#work-item-register-only");
    await app.click("#work-item-create");
    await dialogClosed("work-item-dialog");
    await app.until(`document.querySelector("#sidebar section[data-repository]")`, "the repository in the sidebar");
  }, 120_000);

  afterAll(async () => {
    await app?.stop();
    made?.remove();
  }, 30_000);

  it("asks which chain runs over the form before a new work item's Claude Code pane opens, with the owl chain chosen, opens no pane where the dialog is cancelled, and at the answer launches the pane with the bundle and a settings file of its own that turns the plugin off", async () => {
    await app.click("#sidebar section[data-repository] .repository-add");
    await dialogOpen("work-item-dialog");
    // The form opens to create a work item, whatever it was last used for.
    expect(await value<boolean>(`document.getElementById("work-item-register-only").checked`)).toBe(false);
    await app.click("#work-item-title");
    await app.cdp("Input.insertText", { text: "Chosen" });
    await value(`document.getElementById("work-item-kind").value = "claude"`);
    await app.until(`document.getElementById("work-item-branch").textContent !== ""`, "the plan of the folder");
    await app.click("#work-item-create");
    await dialogOpen("chain-dialog");
    // The form stays under the dialog with what was typed, and the owl chain is the choice the dialog opens on.
    expect([await open("work-item-dialog"), await value<string>(`document.getElementById("work-item-title").value`)]).toEqual([true, "Chosen"]);
    expect(await value<boolean[]>(`[document.getElementById("chain-owlery").checked, document.getElementById("chain-plugin").checked]`)).toEqual([true, false]);
    // A cancel creates nothing and keeps no answer.
    await app.click("#chain-cancel");
    await dialogClosed("chain-dialog");
    expect([await open("work-item-dialog"), commands()]).toEqual([true, []]);
    await app.click("#work-item-create");
    await dialogOpen("chain-dialog");
    await app.click("#chain-submit");
    await dialogClosed("chain-dialog");
    try {
      await app.until(`!document.getElementById("work-item-view").hidden`, "the work item's view");
    } catch (error) {
      throw new Error(`${(error as Error).message}; the form says: ${(await value<string>(`document.getElementById("work-item-error").textContent`)) || "nothing"}`);
    }
    expect(await open("work-item-dialog")).toBe(false);
    const own = join(runDir(), "claude-pane-1.json");
    expect(await commandAfter(0)).toBe(carrying(own));
    expect(JSON.parse(readFileSync(own, "utf8"))).toEqual({ ...hookSettings(), enabledPlugins: { [KEY]: false, "notes@somewhere": true } });
  });

  it("asks nothing at the next Claude Code pane of the repository, and launches it the same way", async () => {
    await pressPaneButton("+ Claude Code");
    expect(await commandAfter(1)).toBe(carrying(join(runDir(), "claude-pane-2.json")));
    expect(await open("chain-dialog")).toBe(false);
  });

  it("shows the answer in the repository's settings, asks again at the next Claude Code pane once the settings took it away, and under the answer of the AgenticSeal plugin launches the pane with the shared settings alone", async () => {
    await openSettings();
    expect(await value<unknown[]>(`[document.getElementById("settings-chain-field").hidden, document.getElementById("settings-chain").value, [...document.getElementById("settings-chain").options].map((option) => option.textContent)]`)).toEqual([false, "owlery", ["Ask at the next Claude Code pane", "The owl chain", "The AgenticSeal plugin"]]);
    await value(`document.getElementById("settings-chain").value = ""`);
    await app.click("#settings-submit");
    await dialogClosed("settings-dialog");
    await pressPaneButton("+ Claude Code");
    await dialogOpen("chain-dialog");
    await app.click("#chain-plugin");
    await app.click("#chain-submit");
    await dialogClosed("chain-dialog");
    expect(await commandAfter(2)).toBe(`exec claude --settings '${join(runDir(), "claude-hooks.json")}'`);
    // The settings hold the new answer, and a shell opens with no question whatever the answer.
    await openSettings();
    expect(await value<string>(`document.getElementById("settings-chain").value`)).toBe("plugin");
    await app.click("#settings-cancel");
    await dialogClosed("settings-dialog");
    expect(commands()).toHaveLength(3);
  });

  it("left every file of the person's Claude Code config folder with the bytes it held, and added none", () => {
    expect(held()).toEqual(before);
  });
});
