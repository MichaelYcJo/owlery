// The role bundle: the plugin folder the app ships, which a role session
// loads for itself alone. Its files started from AgenticSeal and are Owlery's
// own, and the bundle's README.md says where they started.
import { spawn } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import WebSocket from "ws";
import { claudeArgs, versionNotice } from "../src/daemon/adapters/claude";
import { PLUGIN_NAME, roleDocuments, rulesText } from "../src/daemon/adapters/claude-roles";
import { RULING_BLOCK } from "../src/daemon/record-blocks";
import { sectionOf } from "../src/daemon/seal-records";
import { ROLE_STAGES, type ServerMessage } from "../src/shared/protocol";
import { alive, buildApp, BuiltApp, untilGone } from "./built-app";
import { temporaryRepository } from "./repositories";

const APP_DIR = join(__dirname, "..");
const BUNDLE = join(APP_DIR, "role-bundle");

/** Every file under a folder, by its path from the folder, sorted. */
function filesOf(folder: string): string[] {
  const found: string[] = [];
  const walk = (at: string): void => {
    for (const name of readdirSync(at)) {
      const path = join(at, name);
      if (statSync(path).isDirectory()) walk(path);
      else found.push(relative(folder, path));
    }
  };
  walk(folder);
  return found.sort();
}

/** The frontmatter of a document, the lines between its two `---` lines; nothing where it opens with none. */
function frontmatterOf(text: string): string {
  return /^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] ?? "";
}

describe("the role bundle", () => {
  const read = (path: string): string => readFileSync(join(BUNDLE, path), "utf8");

  it("is a plugin named owlery, whose manifest states no version and no hook", () => {
    const manifest = JSON.parse(read(".claude-plugin/plugin.json")) as Record<string, unknown>;
    expect(manifest.name).toBe("owlery");
    expect(PLUGIN_NAME).toBe("owlery");
    expect(Object.keys(manifest).sort()).toEqual(["description", "name"]);
  });

  it("holds the definition of each role a session can be launched as, and every document the adapter appends for its stage", () => {
    expect(ROLE_STAGES.map(({ role }) => role)).toEqual(["proofer", "crafter", "sealer", "orchestrator"]);
    for (const pair of ROLE_STAGES) {
      expect(frontmatterOf(read(`agents/${pair.role}.md`)), pair.role).toContain(`name: ${pair.role}\n`);
      const documents = roleDocuments(pair);
      expect(documents.length, pair.role).toBeGreaterThanOrEqual(2);
      for (const document of documents) expect(existsSync(join(BUNDLE, document)), `${pair.role}: ${document}`).toBe(true);
    }
  });

  it("keeps AgenticSeal's licence text beside the files, and its notice names the source, the release and the licence", () => {
    const licence = read("LICENSE");
    expect(licence.startsWith("MIT License\n")).toBe(true);
    expect(licence).toContain("\nCopyright (c) 2026 AgenticSeal contributors\n");
    expect(licence).toContain("Permission is hereby granted, free of charge, to any person obtaining a copy");
    expect(licence).toContain("The above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.");
    const notice = read("README.md");
    for (const named of ["AgenticSeal", "https://github.com/MichaelYcJo/AgenticSeal", "v0.38.4", "MIT License", "`LICENSE`"]) expect(notice, named).toContain(named);
  });

  it("holds no hook of a session a person watches: no hooks folder, no hooks.json, and no hooks key in the manifest", () => {
    const files = filesOf(BUNDLE);
    expect(files.filter((file) => file.split("/").includes("hooks"))).toEqual([]);
    expect(files.filter((file) => file.endsWith("hooks.json"))).toEqual([]);
    expect(Object.keys(JSON.parse(read(".claude-plugin/plugin.json")) as object)).not.toContain("hooks");
  });

  it("leaves the rules to the file the daemon appends: no definition's frontmatter holds a skills key", () => {
    for (const { role } of ROLE_STAGES) {
      const frontmatter = frontmatterOf(read(`agents/${role}.md`));
      expect(frontmatter, role).not.toBe("");
      expect(frontmatter, role).not.toMatch(/^skills:/m);
    }
  });

  it("holds the orchestrator's definition for its two judgments: the signals that say the rounds are not converging, how a question is decided from the code and the policy, what alone parks a work item, and the blocks of its answer by the keys the daemon reads", () => {
    const definition = read("agents/orchestrator.md");
    for (const named of [
      "whether the review rounds are converging",
      "a ruling on each\nquestion a stage asked",
      "These signals say the rounds are not\nconverging",
      "`reopens:`",
      "`regression:`",
      "**A question is first decided from the code and the policy.**",
      "**Only what a person alone can give parks a work item.**",
      "`decided:`",
      "`grounds:`",
      "You write no file and run no command",
    ]) expect(definition, named).toContain(named);
    for (const ruling of ["answered", "default", "scope", "park"]) expect(definition, ruling).toContain(`- \`${ruling}\`: `);
    // The words of a ruling are the ones the daemon's reader takes.
    expect(RULING_BLOCK.keys.get("rules:")?.shape.source).toContain("default|scope|answered|park");
    // The README no longer says that the bundle holds no definition of the orchestrator.
    expect(read("README.md")).toContain("The bundle holds the orchestrator's definition, `agents/orchestrator.md`, for the two judgments the daemon asks of it");
  });

  it("has the sealer queue and draw no stamp", () => {
    expect(read("agents/sealer.md")).not.toMatch(/stamp/i);
  });

  it("names no command and no script in the sealer's definition, the guarantee's form and its template, and no check line of a test this repository does not hold", () => {
    for (const file of ["agents/sealer.md", "docs/forms/the-guarantee.md", "templates/records/sdd-guarantee.md"]) {
      const text = read(file);
      // A command is a span of code that opens with a program's name: AgenticSeal's CLI, git, GitHub's CLI or an interpreter.
      expect(text.match(/`(?:seal|git|gh|python3?|uv|pnpm|node) [^`]*`/gu), file).toBeNull();
      for (const named of ["seal gate", "seal pr-body", "broad_gate", "chain_check", "Claims re-run", "lib/fields.py", ".py", "scripts/", "check: tests/", "original:"]) expect(text, `${file} names ${named}`).not.toContain(named);
    }
  });

  it("shapes a run's section as the daemon takes one: the template opens with the run's heading, its one seal block holds target: and Verdict: alone, and the daemon's reader takes the template filled in", () => {
    const template = read("templates/records/sdd-guarantee.md");
    expect(template.split("\n")[0]).toBe("## Run <N>");
    const blocks = [...template.matchAll(/^```seal\n([\s\S]*?)^```$/gmu)].map(([, lines = ""]) => lines.trim().split("\n").map((line) => line.slice(0, line.indexOf(":") + 1)));
    expect(blocks).toEqual([["target:", "Verdict:"]]);
    expect([...template.matchAll(/^### .*$/gmu)].map(([heading]) => heading)).toEqual(["### Claims checked by reading", "### The parties"]);
    const target = `${"a".repeat(40)} against main`;
    const filled = template.replace("<N>", "3").replace(/^target: .*$/mu, `target: ${target}`).replace(/^Verdict: .*$/mu, "Verdict: withheld reason: the changelog names `gone.ts`, which the tree does not hold");
    expect(sectionOf(`I read the branch.\n\n${filled}`, { run: 3, target })).toBe(filled);
  });

  it("tells the sealer what the daemon's chain does: it works on the commit the gate passed on, runs no command and writes no file, answers with its run's section, checks each kind of claim by reading, leaves the gate to the daemon, and asks the person through an undecided verdict", () => {
    const definition = read("agents/sealer.md");
    for (const named of [
      "You write no file and run no command that asks for permission: your answer\nis your run's section of `guarantee.md`",
      "the commit you audit is the one your prompt's target line\nnames: the commit the broad gate passed on",
      "The work item names no issue",
      "You check each claim by reading",
      "Each finding a round's record closes `fixed <commit>`",
      "Each decision of `decisions.md` that stands `decided` or `applied`",
      "each `## Removes` row of `frame/design.md`",
      "Each phase record: what it says the phase built stands in the tree",
      "**The parties against each other.**",
      "Its first line is the heading your\n   prompt gives, `## Run <N>`",
      "It holds no\n   other line: the daemon adds who built the work, who judged it, the\n   judging model and its own version",
      "**A question for the person is the verdict `undecided`, with the\nquestion.**",
      "**The daemon holds that the gate passed on the audited commit.**",
      "**The session that judges built none of the work.**",
    ]) expect(definition, named).toContain(named);
    const form = read("docs/forms/the-guarantee.md");
    for (const named of ["`### Claims checked by reading` or `### The parties`", "The daemon writes four lines more into the block, before its closing fence: `built-by:`", "starts \"Get a seal\" again", "the closing records follow", "The closing records are `trail/gate.md`, `guarantee.md` and `trail/refusals.md`"]) expect(form, named).toContain(named);
    for (const gone of ["pull request body", "seal mark", "the orchestrator's broad run"]) expect(form, gone).not.toContain(gone);
    expect(read("README.md")).toContain("a sealer reads the commit the daemon's broad gate passed on and answers with its run's section of the guarantee, which the daemon completes with who built the work and who judged it, writes and commits");
  });

  it("holds no script, no library and no drawing: every file under the four taken folders is a document", () => {
    const taken = filesOf(BUNDLE).filter((file) => /^(agents|skills|docs|templates)\//.test(file));
    expect(taken.filter((file) => !file.endsWith(".md"))).toEqual([]);
    expect(filesOf(BUNDLE).filter((file) => /^(lib|bin|scripts)\//.test(file))).toEqual([]);
  });
});

describe("the built app's role bundle", () => {
  beforeAll(() => buildApp(), 60_000);

  const cleanups: (() => Promise<void> | void)[] = [];
  afterEach(async () => {
    for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
  });

  it("is the bundle of the tree at dist/bundle, each file with the same bytes and no file more, a file an earlier build left there among them", () => {
    const built = join(APP_DIR, "dist", "bundle");
    // A file the tree's bundle held once and holds no more: a build replaces the folder whole, so a session never loads it.
    mkdirSync(join(built, "hooks"), { recursive: true });
    writeFileSync(join(built, "hooks", "hooks.json"), "{}\n");
    buildApp();
    const files = filesOf(BUNDLE);
    expect(filesOf(built)).toEqual(files);
    for (const file of files) expect(readFileSync(join(built, file)).equals(readFileSync(join(BUNDLE, file))), file).toBe(true);
  });

  it("is what the built daemon launches a role with: the bundle beside its script, and a rules file it writes into its run folder", async () => {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    const runDir = realpathSync(mkdtempSync(join(tmpdir(), "owlery-role-run-")));
    cleanups.push(() => rmSync(runDir, { recursive: true, force: true }));
    const script = (name: string, body: string): string => {
      const file = join(made.base, name);
      writeFileSync(file, `#!/bin/sh\n${body}\n`);
      chmodSync(file, 0o755);
      return file;
    };
    // Stands for the CLI: records a session's arguments, then prints the first line of a session that holds the bundle's agents, and a result.
    // The daemon also runs it at its start, to read its version, and that run records nothing.
    const cli = script(
      "cli",
      [
        `if [ "$*" = "--version" ]; then echo '2.1.330 (Claude Code)'; exit 0; fi`,
        `for a in "$@"; do printf '%s\\n' "$a"; done > '${made.base}/args'`,
        `echo '{"type":"system","subtype":"init","agents":["claude","owlery:crafter","owlery:proofer","owlery:sealer"]}'`,
        `echo '{"type":"result","is_error":false,"result":"read","total_cost_usd":0}'`,
        // It exits at the end of its input, which the daemon ends once the result has arrived.
        "cat > /dev/null",
      ].join("\n"),
    );
    // Stands for the login shell, and is the shell of the work item's pane too: it names the CLI and ends.
    const shell = script("shell", `printf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n' '${cli}' '/usr/bin:/bin'`);
    const built = join(APP_DIR, "dist");
    const daemon = spawn(process.execPath, [join(built, "daemon.js")], {
      env: { ELECTRON_RUN_AS_NODE: "1", OWLERY_RUN_DIR: runDir, OWLERY_WORKTREES: made.root, SHELL: shell, HOME: made.base, USER: "person", PATH: process.env.PATH ?? "/usr/bin:/bin" },
      stdio: "ignore",
    });
    const pid = daemon.pid!;
    cleanups.push(async () => {
      if (alive(pid)) process.kill(pid, "SIGTERM");
      for (const left of await untilGone([pid], 5_000)) process.kill(left, "SIGKILL");
    });
    const discovery = join(runDir, "daemon.json");
    const end = Date.now() + 10_000;
    while (!existsSync(discovery) && Date.now() < end) await new Promise((r) => setTimeout(r, 50));
    const { port, token } = JSON.parse(readFileSync(discovery, "utf8")) as { port: number; token: string };

    const socket = new WebSocket(`ws://127.0.0.1:${port}`);
    cleanups.push(() => socket.close());
    const messages: ServerMessage[] = [];
    socket.on("message", (raw) => messages.push(JSON.parse(String(raw)) as ServerMessage));
    await new Promise<void>((resolve, reject) => {
      socket.once("open", () => resolve());
      socket.once("error", reject);
    });
    const message = async <K extends ServerMessage["type"]>(type: K, where: (m: Extract<ServerMessage, { type: K }>) => boolean = () => true): Promise<Extract<ServerMessage, { type: K }>> => {
      const until = Date.now() + 10_000;
      for (;;) {
        const found = messages.find((m): m is Extract<ServerMessage, { type: K }> => m.type === type && where(m as Extract<ServerMessage, { type: K }>));
        if (found) return found;
        if (Date.now() > until) throw new Error(`no ${type}; got ${JSON.stringify(messages)}`);
        await new Promise((r) => setTimeout(r, 20));
      }
    };
    socket.send(JSON.stringify({ type: "hello", token }));
    await message("ready");
    socket.send(JSON.stringify({ type: "createWorkItem", requestId: 1, repo: made.repo, title: "Reviewed", kind: "shell", cols: 80, rows: 24 }));
    const { workItem } = await message("workItemCreated");
    const role = { role: "proofer", stage: "round" } as const;
    socket.send(JSON.stringify({ type: "ask", requestId: 2, workItemId: workItem.id, prompt: "Read it.", role }));
    const { headless } = await message("headless", (m) => m.headless.state !== "working");
    expect([headless.state, headless.answer, headless.error, headless.role]).toEqual(["finished", "read", null, role]);

    const bundleDir = join(built, "bundle");
    const rulesFile = join(runDir, "roles", "proofer-round.md");
    expect(readFileSync(join(made.base, "args"), "utf8").split("\n").slice(0, -1)).toEqual(claudeArgs(workItem.worktree, { bundleDir, agent: "owlery:proofer", rulesFile, tools: ["Read", "Glob", "Grep", "Bash"] }));
    // The rules of the launch are the built bundle's documents, which the case above holds equal to the tree's.
    expect(readFileSync(rulesFile, "utf8")).toBe(rulesText(bundleDir, role));
    expect(readFileSync(rulesFile, "utf8")).toContain("the retired numbers are 8, 16 and 20");
  }, 30_000);
});

// The window's status line against the daemon the app starts, whose adapter finds a stand-in for the CLI through a stand-in for the login shell.
describe("the built app's notice of an old CLI", { timeout: 120_000 }, () => {
  it("says in the status line that the CLI the daemon found is older than the oldest version checked, says it again in a page loaded anew, and shows the daemon's state once the CLI is a checked version", async () => {
    buildApp();
    const folder = realpathSync(mkdtempSync(join(tmpdir(), "owlery-old-cli-")));
    const script = (name: string, body: string): string => {
      const file = join(folder, name);
      writeFileSync(file, `#!/bin/sh\n${body}\n`);
      chmodSync(file, 0o755);
      return file;
    };
    const version = join(folder, "version");
    const hold = join(folder, "hold");
    writeFileSync(version, "2.1.300 (Claude Code)\n");
    // Stands for the CLI: asked for its version, it prints the file's, once no file holds it back. A held one also ends once this script is gone, with the folder of a case that failed.
    const cli = script("cli", `[ "$*" = "--version" ] || exit 1\nwhile [ -e '${hold}' ] && [ -e "$0" ]; do sleep 0.05; done\ncat '${version}'`);
    // Stands for the login shell: it names the CLI and ends.
    const shell = script("shell", `printf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n' '${cli}' '/usr/bin:/bin'`);
    const old = versionNotice("2.1.300 (Claude Code)");
    expect(old).toBe(`Claude Code 2.1.300 is older than 2.1.326, the oldest version Owlery's role sessions were checked on. Run "claude update" in a terminal.`);
    /** What the status line says, and whether it is drawn as a notice. */
    const status = (): Promise<{ text: string; notice: boolean }> => app.evaluate(`({ text: document.getElementById("status").textContent, notice: document.getElementById("status").classList.contains("notice") })`);
    const app = await BuiltApp.start({ SHELL: shell });
    let left: number[];
    try {
      // The daemon read the version at its start, in the background: the sentence arrives in `ready` or in the message that follows it.
      await app.until(`document.getElementById("status")?.textContent === ${JSON.stringify(old)}`, "the notice of the old CLI");
      expect(await status()).toEqual({ text: old, notice: true });

      // The person updates. The daemon reads the version again as a window connects, and that read is held here, so the page loaded anew has the sentence from the daemon's `ready` alone.
      writeFileSync(hold, "");
      writeFileSync(version, "2.1.326 (Claude Code)\n");
      await app.evaluate(`window.__beforeReload = true`);
      await app.cdp("Page.reload");
      await app.until(`window.__beforeReload === undefined && document.getElementById("status")?.textContent === ${JSON.stringify(old)}`, "the notice in the page loaded anew");
      expect(await status()).toEqual({ text: old, notice: true });

      // The read ends, and the daemon tells the window that the notice went.
      rmSync(hold);
      await app.until(`document.getElementById("status")?.textContent === "Daemon running, no agent"`, "the daemon's state once the CLI is a checked version");
      expect(await status()).toEqual({ text: "Daemon running, no agent", notice: false });
    } finally {
      rmSync(hold, { force: true });
      left = await app.stop();
      rmSync(folder, { recursive: true, force: true });
    }
    expect(left).toEqual([]);
  });
});
