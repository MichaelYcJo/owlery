// One real role session: the person's own `claude`, on their login, launched
// as the proofer at a round with the built bundle. It costs the person's
// usage, so the suite never runs it: `pnpm run role:run` sets
// `OWLERY_ROLE_RUN` and takes it. Without the variable the file runs nothing.
//
// The session is asked three things it can answer only from what a role
// launch gives it: one from its definition, one from the rules the daemon
// appended, and one from a file of the bundle it has to open. The case also
// holds the person's settings files and plugin lists to their bytes.
import { execFile } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import WebSocket from "ws";
import { claudeAdapter, lookupCommand, parseLookup } from "../src/daemon/adapters/claude";
import { Daemon } from "../src/daemon/daemon";
import { PANE_KINDS } from "../src/daemon/pane-kinds";
import { terminalEnv } from "../src/daemon/pty";
import type { HeadlessInfo, ServerMessage } from "../src/shared/protocol";
import { buildApp } from "./built-app";
import { temporaryRepository } from "./repositories";

/** The run, started by `pnpm run role:run`. */
const RUN = process.env.OWLERY_ROLE_RUN === "1";

/** The files a role session must leave as they were: the person's settings, and the lists of the plugins and marketplaces they installed. */
const UNCHANGED = [".claude/settings.json", ".claude/settings.local.json", ".claude/plugins/installed_plugins.json", ".claude/plugins/known_marketplaces.json"];

const PROMPT = [
  "Answer these three questions in three short numbered lines, and do nothing else: run no command and write no file.",
  "1. Your definition names the directory you clone the repository into for a round. Quote that path exactly as your definition writes it.",
  "2. Which rule numbers of the agent contract are retired? Quote the numbers as the contract lists them.",
  "3. Read the file `templates/records/sdd-round.md` of the role bundle, and quote its first line exactly.",
].join("\n");

describe.skipIf(!RUN)("a real role session, on the person's own Claude login", () => {
  let made: ReturnType<typeof temporaryRepository> | undefined;
  let daemon: Daemon | undefined;
  let socket: WebSocket | undefined;

  beforeAll(() => buildApp(), 60_000);
  afterAll(async () => {
    socket?.close();
    await daemon?.close();
    made?.remove();
  });

  const bytes = (): (string | null)[] => UNCHANGED.map((file) => (existsSync(join(homedir(), file)) ? readFileSync(join(homedir(), file)).toString("base64") : null));

  it("answers from its definition, from the appended rules and from a file of the bundle, and changes no settings file and no plugin list", async () => {
    // The CLI as the adapter finds it, through the person's login shell. The adapter is then given a shell that names a
    // script in its place: the script runs that CLI with the arguments and the environment the adapter gave it, and
    // keeps a copy of what it printed.
    const repository = temporaryRepository();
    made = repository;
    // Kept after the run: the folder holds the output stream as the CLI printed it, which the run's record and the suite's fixture are made from.
    const kept = realpathSync(mkdtempSync(join(tmpdir(), "owlery-role-run-")));
    const stream = join(kept, "stream.jsonl");
    const { command, args } = lookupCommand(process.env);
    const printed = await new Promise<string>((resolve) => execFile(command, args, { env: terminalEnv(process.env), encoding: "utf8", timeout: 30_000 }, (_error, stdout) => resolve(stdout)).stdin?.end());
    const found = parseLookup(printed);
    expect(found, "the login shell finds claude").toBeDefined();
    const { cli, path } = found!;
    const script = (name: string, body: string): string => {
      const file = join(kept, name);
      writeFileSync(file, `#!/bin/sh\n${body}\n`);
      chmodSync(file, 0o755);
      return file;
    };
    const copying = script("claude-copying", `'${cli}' "$@" | tee '${stream}'`);
    const shell = script("shell", `printf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n' '${copying}' '${path}'`);

    const before = bytes();
    const bundleDir = join(__dirname, "..", "dist", "bundle");
    const token = "r".repeat(64);
    daemon = new Daemon({
      token,
      paneKinds: PANE_KINDS,
      roleAdapter: claudeAdapter({ ...process.env, SHELL: shell }, { bundleDir, rulesDir: join(kept, "roles") }),
      commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 0"], env: {} }),
      worktreesRoot: repository.root,
    });
    const port = await daemon.listen(0);
    const client = new WebSocket(`ws://127.0.0.1:${port}`);
    socket = client;
    const messages: ServerMessage[] = [];
    client.on("message", (raw) => messages.push(JSON.parse(String(raw)) as ServerMessage));
    await new Promise<void>((resolve, reject) => {
      client.once("open", () => resolve());
      client.once("error", reject);
    });
    const message = async <K extends ServerMessage["type"]>(type: K, where: (m: Extract<ServerMessage, { type: K }>) => boolean, ms: number): Promise<Extract<ServerMessage, { type: K }>> => {
      const end = Date.now() + ms;
      for (;;) {
        const got = messages.find((m): m is Extract<ServerMessage, { type: K }> => m.type === type && where(m as Extract<ServerMessage, { type: K }>));
        if (got) return got;
        if (Date.now() > end) throw new Error(`no ${type} within ${ms} ms`);
        await new Promise((r) => setTimeout(r, 100));
      }
    };
    client.send(JSON.stringify({ type: "hello", token }));
    await message("ready", () => true, 10_000);
    client.send(JSON.stringify({ type: "createWorkItem", requestId: 1, repo: repository.repo, title: "A real role session", kind: "shell", cols: 80, rows: 24 }));
    const { workItem } = await message("workItemCreated", () => true, 10_000);
    client.send(JSON.stringify({ type: "ask", requestId: 2, workItemId: workItem.id, prompt: PROMPT, role: { role: "proofer", stage: "round" } }));
    const headless: HeadlessInfo = (await message("headless", (m) => m.headless.state !== "working", 280_000)).headless;
    const after = bytes();

    // What the run's record is written from: the session as the daemon holds it, and what its result line says it cost.
    const lines = existsSync(stream) ? readFileSync(stream, "utf8").split("\n").filter(Boolean) : [];
    const result = lines.map((line) => JSON.parse(line) as Record<string, unknown>).find((line) => line.type === "result");
    console.log(JSON.stringify({ kept, headless, usage: result?.usage, modelUsage: result?.modelUsage, permissionDenials: result?.permission_denials, numTurns: result?.num_turns }, null, 2));

    expect([headless.state, headless.error, headless.role]).toEqual(["finished", null, { role: "proofer", stage: "round" }]);
    // Only `agents/proofer.md` states this path.
    expect(headless.answer).toContain("round-<n>/clone");
    // Only `skills/agent-contract/SKILL.md` states the retired numbers.
    expect(headless.answer).toMatch(/8, 16,? and 20/);
    // The first line of `templates/records/sdd-round.md`, which no appended document holds.
    expect(headless.answer).toContain("# Review round <N>");
    expect(after).toEqual(before);
  }, 300_000);
});
