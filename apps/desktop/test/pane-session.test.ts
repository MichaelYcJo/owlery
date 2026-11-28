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
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { HookServer, paneCommands, writeHookSettings, type HookEvent } from "../src/daemon/hooks";
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
const QUESTION = "Call the AskUserQuestion tool once, with the single question 'Which colour?' and the two options red and blue. Make no other tool call. Then say in one line what the call returned, and stop.";

/** What a terminal printed, without the sequences that move the cursor and set a colour, and without spaces, which the CLI draws by moving the cursor. */
function drawn(text: string): string {
  return text.replace(/\u001b\[[0-9;?]*[a-zA-Z]/gu, "").replace(/ /gu, "");
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
   * daemon starts it, types each prompt as a turn of its own, ends the
   * session, and gives what the session answered, what its tools returned,
   * the hooks' events, the directory the chain command's `start` made, and
   * the settings file the pane was launched with.
   */
  async function sessionOf(prompts: readonly string[]): Promise<{ answers: string; results: string; events: HookEvent[]; directory: string; settingsFile: string; shared: string }> {
    // A repository on the owl chain, with a records root, on a branch that holds one commit.
    const repository = temporaryRepository();
    cleanups.push(repository.remove);
    const { repo, base } = repository;
    const write = (path: string, text: string): void => {
      mkdirSync(join(repo, path, ".."), { recursive: true });
      writeFileSync(join(repo, path), text);
    };
    write("iadd/README.md", `${MARKER}\n`);
    write("iadd/config.json", '{ "Mode": "shared", "Record language": "English", "Broad gate": "true" }\n');
    write(".github/workflows/owlery-inspection.yml", workflowText("0.0.0"));
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
    const { command, args, env } = paneCommands(process.env, settings, server.socketPath, carriedIn(chain))("claude", 1, { continueLatest: false, folder: repo, base: "main", accountDir: null });
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
    console.log(JSON.stringify({ events: events.map((event) => [event.name, event.payload.tool_name ?? null]), directory: started.directory, answers }, null, 2));
    return { answers, results, events, directory: started.directory, settingsFile, shared: settings };
  }

  it("offers the bundle's four agents and its skill, holds the head, and is refused an AskUserQuestion call by the bundle's hook where the routing answers Automation yes, and changes no settings file and no plugin list", async () => {
    const before = bytes();
    const { answers, results, events, directory, settingsFile, shared } = await sessionOf([LISTING, QUESTION]);
    const after = bytes();
    // The pane takes the settings file every pane shares.
    expect(settingsFile).toBe(shared);
    // The bundle is loaded as the plugin `owlery`: its four agents and the skill a pane's session opens.
    for (const named of ["owlery:proofer", "owlery:crafter", "owlery:inspector", "owlery:orchestrator", "owlery:inspection"]) expect(answers, named).toContain(named);
    // The head reached the session's system prompt.
    expect(answers).toContain(paneHead().split("\n")[0]);
    expect(answers).toContain("A branch is cleared by the Owl Chain's inspection before its pull request is opened or the work is called done.");
    // The call reached the bundle's hook, and the built command refused it with its reason, which the session was handed.
    expect(events.filter((event) => event.name === "PreToolUse").map((event) => event.payload.tool_name)).toContain("AskUserQuestion");
    expect(results).toContain(`${directory}/routing.md answers \`Automation\` \`yes\`, so this run does not stop for a question.`);
    expect(after).toEqual(before);
  }, 600_000);
});
