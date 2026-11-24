// A real pane: the person's own `claude`, on their login, started as the
// daemon starts a Claude Code pane that carries the owl chain, with the built
// bundle, the pane's head, the hook settings and the chain command's
// launcher. It costs the person's usage, so the suite never runs it:
// `pnpm run pane:run` sets `OWLERY_PANE_RUN` and takes the one case. Without
// the variable the file runs nothing.
//
// The session is asked two things only a pane on the owl chain answers so.
// It lists the bundle's agents and its skill and quotes the head, from its
// context alone. Then it calls `AskUserQuestion` in a work item whose routing
// answers `Automation` `yes`, and the bundle's hook, through the launcher and
// the built chain command, refuses the call with the command's reason. The
// case also holds the person's settings files and plugin lists to their
// bytes. Claude Code itself keeps the session's conversation, and its answer
// to the question whether the temporary folder is trusted, in its own files.
//
// A second case starts the pane under the person's choice of the owl chain,
// with the settings file the daemon writes for such a pane, and asks the
// session for every agent and skill it is offered: the bundle's are there,
// and none of the AgenticSeal plugin's is. It reads the names the session
// wrote as the items of its lists, since a session may name the plugin in a
// sentence that says the plugin is not there. It also reads the hooks whose
// run Claude Code recorded in the conversation, and finds no hook of the
// plugin's among them. Claude Code records a hook that printed something, as
// the plugin's hook at a session's start does, so a hook of the plugin that
// prints nothing is not read. The case reads the person's own Claude Code
// settings and the plugin's install folder, writes neither, and holds only
// where their Claude Code enables that plugin.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { claudeConfigDir, readPlugins } from "../src/daemon/claude-plugins";
import { HookServer, paneCommands, paneSettingsFile, writeHookSettings, type HookEvent } from "../src/daemon/hooks";
import { carriedIn, paneHead, writePaneChain } from "../src/daemon/pane-chain";
import { TerminalSession, terminalEnv } from "../src/daemon/pty";
import { MARKER, workflowText } from "../src/daemon/records-place";
import { buildApp } from "./built-app";
import { git, temporaryRepository } from "./repositories";

/** The run, started by `pnpm run pane:run`. */
const RUN = process.env.OWLERY_PANE_RUN === "1";

/** The files a pane must leave as they were: the person's settings, and the lists of the plugins and marketplaces they installed. */
const UNCHANGED = [".claude/settings.json", ".claude/settings.local.json", ".claude/plugins/installed_plugins.json", ".claude/plugins/known_marketplaces.json"];

const LISTING = "Answer from your context alone and call no tool. List every agent type your Agent tool offers whose name starts with owlery: and every skill offered to you whose name starts with owlery: . Then quote whole the section of your system prompt whose first line starts with '# Owlery', or say that you hold none.";
const EVERY = "Answer from your context alone and call no tool. List every agent type your Agent tool offers, each by its full name, and then every skill offered to you, each by its full name. Write each name as an item of a list, on a line of its own. Leave none out.";
const QUESTION = "Call the AskUserQuestion tool once, with the single question 'Which colour?' and the two options red and blue. Make no other tool call. Then say in one line what the call returned, and stop.";

/** What a terminal printed, without the sequences that move the cursor and set a colour, and without spaces, which the CLI draws by moving the cursor. */
function drawn(text: string): string {
  return text.replace(/\u001b\[[0-9;?]*[a-zA-Z]/gu, "").replace(/ /gu, "");
}

/** The names a session's answer lists: the first word of each line that is an item of a list, numbered or marked, without the marks of code around it. A name in a sentence is not among them. */
function itemsOf(answer: string): string[] {
  return [...answer.matchAll(/^\s*(?:\d+\.|[-*])\s+`?([^`\s]+)/gmu)].map((item) => item[1] ?? "");
}

/** The commands of the hooks a plugin's install folders hold in `hooks/hooks.json`, for each of the keys, read from the person's list of installed plugins. */
function hooksOf(keys: readonly string[]): string[] {
  const installed = (JSON.parse(readFileSync(join(claudeConfigDir(), "plugins", "installed_plugins.json"), "utf8")) as { plugins: Record<string, { installPath: string }[] | undefined> }).plugins;
  return keys
    .flatMap((key) => installed[key] ?? [])
    .map(({ installPath }) => join(installPath, "hooks", "hooks.json"))
    .filter((file) => existsSync(file))
    .flatMap((file) => Object.values((JSON.parse(readFileSync(file, "utf8")) as { hooks?: Record<string, { hooks?: { command?: unknown }[] }[]> }).hooks ?? {}).flat())
    .flatMap((entry) => entry.hooks ?? [])
    .map((hook) => hook.command)
    .filter((command): command is string => typeof command === "string");
}

describe.skipIf(!RUN)("a real Claude Code pane on the owl chain, on the person's own Claude login", () => {
  /** What each session started, to end after the cases: its pane, its hook socket and its repository. */
  const cleanups: (() => Promise<void> | void)[] = [];

  beforeAll(() => buildApp(), 60_000);
  afterAll(async () => {
    for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
  });

  const bytes = (): (string | null)[] => UNCHANGED.map((file) => (existsSync(join(homedir(), file)) ? readFileSync(join(homedir(), file)).toString("base64") : null));

  /**
   * Starts a pane on the owl chain in a repository the case makes, as the
   * daemon starts it under the person's answer `chosen`, types each prompt
   * as a turn of its own, ends the session, and gives what the session
   * answered, what its tools returned, the hooks' events, the command of
   * each hook whose run Claude Code recorded in the conversation, the
   * directory the chain command's `start` made, and the settings file the
   * pane was launched with.
   */
  async function sessionOf(chosen: "owlery" | null, prompts: readonly string[]): Promise<{ answers: string; results: string; events: HookEvent[]; hooks: string[]; directory: string; settingsFile: string; shared: string; runDir: string }> {
    // A repository on the owl chain, with a records root, on a branch that holds one commit.
    const repository = temporaryRepository();
    cleanups.push(repository.remove);
    const { repo, base } = repository;
    const write = (path: string, text: string): void => {
      mkdirSync(join(repo, path, ".."), { recursive: true });
      writeFileSync(join(repo, path), text);
    };
    write("seal/README.md", `${MARKER}\n`);
    write("seal/config.json", '{ "Mode": "shared", "Record language": "English", "Broad gate": "true" }\n');
    write(".github/workflows/owlery-seal.yml", workflowText("0.0.0"));
    git(repo, "add", "--all");
    git(repo, "commit", "--quiet", "-m", "chore: the records place");
    git(repo, "switch", "--quiet", "-c", "feat/pane-run");
    write("built.txt", "built\n");
    git(repo, "add", "--all");
    git(repo, "commit", "--quiet", "-m", "feat: one file");

    // The run folder as the daemon's entry fills it (`main.ts`): the hook settings, the head and the launcher of the built command.
    const dist = join(__dirname, "..", "dist");
    const runDir = join(base, "run");
    const settings = writeHookSettings(runDir);
    const chain = writePaneChain(runDir, { node: process.execPath, script: join(dist, "chain.js"), bundleDir: join(dist, "bundle") });
    const server = await HookServer.listen(join(runDir, "hooks.sock"));
    cleanups.push(() => server.close());
    const events: HookEvent[] = [];
    server.onEvent((event) => events.push(event));
    // Under the choice the person's own settings are read for the plugin, as the daemon reads them. With no answer the pane is launched as the daemon launches one where it finds no such plugin, so the first case runs on a machine that enables it too.
    const carries = chosen === null ? carriedIn(chain, () => ({ enabled: {}, agenticSeal: [] })) : carriedIn(chain);
    const { command, args, env } = paneCommands(process.env, settings, server.socketPath, carries)("claude", 1, { continueLatest: false, folder: repo, base: "main", checkout: repo, chosen, accountDir: null, configDir: null });
    expect(env.OWLERY_CHAIN, "the pane carries the owl chain").toBe(chain.launcher);
    const settingsFile = /--settings '([^']+)'/u.exec(args[3] ?? "")?.[1] ?? "";
    const paneEnv = { ...process.env, ...env, OWLERY_RUN_DIR: runDir };
    // The routing, written by the built command through the launcher, as a pane's session runs it.
    const started = JSON.parse(execFileSync(chain.launcher, ["start", "--automation", "yes"], { cwd: repo, encoding: "utf8", env: terminalEnv(paneEnv) })) as { directory: string };

    let printed = "";
    let exited = false;
    const pane = TerminalSession.spawn({ command, args, cwd: repo, cols: 160, rows: 50, env: paneEnv });
    cleanups.push(() => pane.kill());
    pane.onData((data) => (printed += data));
    pane.onExit(() => (exited = true));
    const pause = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
    const until = async (what: string, holds: () => boolean, ms: number): Promise<void> => {
      const end = Date.now() + ms;
      while (!holds()) {
        if (exited) throw new Error(`the pane ended before ${what}; it printed last: ${drawn(printed).slice(-600)}`);
        if (Date.now() > end) throw new Error(`no ${what} within ${String(ms)} ms; the hooks sent ${events.map((event) => event.name).join(", ")}`);
        await pause(100);
      }
    };
    const seen = (name: string): number => events.filter((event) => event.name === name).length;
    const type = async (line: string): Promise<void> => {
      pane.write(line);
      await pause(1000);
      pane.write("\r");
    };

    // Claude Code asks once whether a folder it has not seen is trusted. The line the dialog opens on differs by folder, so the choice is moved onto "Yes" before it is confirmed.
    await until("the session's start or the question of trust", () => seen("SessionStart") > 0 || /trustthisfolder/iu.test(drawn(printed)), 60_000);
    if (seen("SessionStart") === 0) {
      for (let moved = 0; moved < 3 && !/❯(?:\d\.)?Yes/u.test(drawn(printed.slice(printed.lastIndexOf("❯")))); moved += 1) {
        // Control-N moves a choice of Claude Code down one line.
        pane.write("\u000e");
        await pause(1000);
      }
      expect(drawn(printed.slice(printed.lastIndexOf("❯"))), "the question of trust stands on Yes").toMatch(/❯(?:\d\.)?Yes/u);
      pane.write("\r");
      await until("the session's start", () => seen("SessionStart") > 0, 60_000);
    }
    await pause(4000);
    for (const [at, prompt] of prompts.entries()) {
      await type(prompt);
      await until(`the end of turn ${String(at + 1)}`, () => seen("Stop") >= at + 1, 180_000);
      await pause(2000);
    }
    await type("/exit");
    await until("the pane's end", () => exited, 20_000).catch(() => pane.kill());

    // The conversation as Claude Code kept it, which the hooks' events name.
    const transcriptPath = events.map((event) => event.payload.transcript_path).find((path): path is string => typeof path === "string");
    expect(transcriptPath, "a hook's event names the conversation's file").toBeDefined();
    const lines = readFileSync(transcriptPath!, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as { type?: string; message?: { content?: unknown }; attachment?: { type?: unknown; command?: unknown } });
    const blocks = (type: string): { type?: string; text?: string; content?: unknown }[] => lines.filter((line) => line.type === type).flatMap((line) => (Array.isArray(line.message?.content) ? (line.message.content as { type?: string; text?: string; content?: unknown }[]) : []));
    const answers = blocks("assistant")
      .filter((block) => block.type === "text")
      .map((block) => block.text ?? "")
      .join("\n");
    const results = JSON.stringify(blocks("user").filter((block) => block.type === "tool_result"));
    // Claude Code keeps a hook's run in the conversation as an attachment whose type opens with `hook_`, with the hook's command, where the hook printed something.
    const hooks = lines.map((line) => line.attachment).filter((attachment) => typeof attachment?.type === "string" && attachment.type.startsWith("hook_")).map((attachment) => attachment?.command).filter((command): command is string => typeof command === "string");
    console.log(JSON.stringify({ events: events.map((event) => [event.name, event.payload.tool_name ?? null]), directory: started.directory, answers }, null, 2));
    return { answers, results, events, hooks, directory: started.directory, settingsFile, shared: settings, runDir };
  }

  it("offers the bundle's four agents and its skill, holds the head, and is refused an AskUserQuestion call by the bundle's hook where the routing answers Automation yes, and changes no settings file and no plugin list", async () => {
    const before = bytes();
    const { answers, results, events, directory, settingsFile, shared } = await sessionOf(null, [LISTING, QUESTION]);
    const after = bytes();
    // A pane with no choice takes the settings file every pane shares.
    expect(settingsFile).toBe(shared);
    // The bundle is loaded as the plugin `owlery`: its four agents and the skill a pane's session opens.
    for (const named of ["owlery:proofer", "owlery:crafter", "owlery:sealer", "owlery:orchestrator", "owlery:seal"]) expect(answers, named).toContain(named);
    // The head reached the session's system prompt.
    expect(answers).toContain(paneHead().split("\n")[0]);
    expect(answers).toContain("A branch takes its seal from the owl chain before its pull request is opened or the work is called done.");
    // The call reached the bundle's hook, and the built command refused it with its reason, which the session was handed.
    expect(events.filter((event) => event.name === "PreToolUse").map((event) => event.payload.tool_name)).toContain("AskUserQuestion");
    expect(results).toContain(`${directory}/routing.md answers \`Automation\` \`yes\`, so this run does not stop for a question.`);
    expect(after).toEqual(before);
  }, 600_000);

  it("under the person's choice of the owl chain is launched with a settings file of its own that sets each key of the AgenticSeal plugin to false, offers the bundle's agents and no agent or skill of that plugin, records no hook of that plugin, and changes no settings file and no plugin list", async () => {
    const before = bytes();
    // The person's own Claude Code settings, read and never written. The repository the case makes has none of its own, so the user's files state everything.
    const read = readPlugins(tmpdir(), tmpdir());
    expect(read.agenticSeal, "the person's Claude Code enables the AgenticSeal plugin, which is what this case is about").not.toEqual([]);
    const { answers, hooks, settingsFile, runDir } = await sessionOf("owlery", [EVERY]);
    const after = bytes();
    expect(settingsFile).toBe(paneSettingsFile(runDir, 1));
    const enabledPlugins = (JSON.parse(readFileSync(settingsFile, "utf8")) as { enabledPlugins: Record<string, unknown> }).enabledPlugins;
    expect(enabledPlugins).toEqual({ ...read.enabled, ...Object.fromEntries(read.agenticSeal.map((key) => [key, false])) });
    // The names the session listed, which hold the bundle's, so the lists were read.
    const listed = itemsOf(answers);
    for (const named of ["owlery:proofer", "owlery:crafter", "owlery:sealer", "owlery:orchestrator", "owlery:seal"]) expect(listed, named).toContain(named);
    // A plugin's agents and skills are offered under its name, which is the part of its key before the marketplace's.
    for (const key of read.agenticSeal) expect(listed.filter((name) => name.startsWith(`${key.split("@")[0] ?? key}:`)), key).toEqual([]);
    // The plugin holds hooks, and the conversation records the run of none of them.
    const ofPlugin = hooksOf(read.agenticSeal);
    expect(ofPlugin, "the AgenticSeal plugin holds hooks, so their absence from the conversation says something").not.toEqual([]);
    expect(hooks.filter((command) => ofPlugin.includes(command))).toEqual([]);
    expect(after).toEqual(before);
  }, 600_000);
});
