// The role bundle: the plugin folder the app ships, which a role session
// loads for itself alone. Its files are taken from AgenticSeal, and the
// bundle's README.md says at which release and with which changes.
import { spawn } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import WebSocket from "ws";
import { claudeArgs, versionNotice } from "../src/daemon/adapters/claude";
import { PLUGIN_NAME, roleDocuments, rulesText } from "../src/daemon/adapters/claude-roles";
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
    expect(ROLE_STAGES.map(({ role }) => role)).toEqual(["proofer", "crafter", "sealer"]);
    for (const pair of ROLE_STAGES) {
      expect(frontmatterOf(read(`agents/${pair.role}.md`)), pair.role).toContain(`name: ${pair.role}\n`);
      const documents = roleDocuments(pair);
      expect(documents.length, pair.role).toBeGreaterThanOrEqual(2);
      for (const document of documents) expect(existsSync(join(BUNDLE, document)), `${pair.role}: ${document}`).toBe(true);
    }
  });

  it("holds the 15 documents taken from AgenticSeal, its licence, the notice and the manifest, and no other file", () => {
    expect(filesOf(BUNDLE)).toEqual(
      [
        ".claude-plugin/plugin.json",
        "LICENSE",
        "README.md",
        "agents/crafter.md",
        "agents/proofer.md",
        "agents/sealer.md",
        "docs/forms/the-guarantee.md",
        "docs/forms/the-round-record.md",
        "skills/agent-contract/SKILL.md",
        "skills/code-review/SKILL.md",
        "skills/core/SKILL.md",
        "skills/implement/SKILL.md",
        "skills/implement/fix-pass.md",
        "skills/verify/SKILL.md",
        "skills/writing-style/SKILL.md",
        "templates/records/sdd-gaps.md",
        "templates/records/sdd-guarantee.md",
        "templates/records/sdd-round.md",
      ].sort(),
    );
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

  it("has the sealer queue and draw no stamp", () => {
    expect(read("agents/sealer.md")).not.toMatch(/stamp/i);
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
        "cat > /dev/null",
        `echo '{"type":"system","subtype":"init","agents":["claude","owlery:crafter","owlery:proofer","owlery:sealer"]}'`,
        `echo '{"type":"result","is_error":false,"result":"read","total_cost_usd":0}'`,
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
    expect(readFileSync(join(made.base, "args"), "utf8").split("\n").slice(0, -1)).toEqual(claudeArgs(workItem.worktree, { bundleDir, agent: "owlery:proofer", rulesFile }));
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
