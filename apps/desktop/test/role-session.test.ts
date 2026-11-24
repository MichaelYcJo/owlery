// Real role sessions: the person's own `claude`, on their login, launched as
// a role at its stage with the built bundle. Each costs the person's
// usage, so the suite never runs one: `pnpm run role:run` sets
// `OWLERY_ROLE_RUN` and takes the first case, as the proofer at a round, and
// `pnpm run role:refusal` and `pnpm run role:refusal:sealer` set
// `OWLERY_ROLE_REFUSAL` and take the second, as the proofer at a round and
// as the sealer at the seal, so each script spends one session. Without
// either variable the file runs nothing.
//
// The first session is asked three things it can answer only from what a
// role launch gives it: one from its definition, one from the rules the
// daemon appended, and one from a file of the bundle it has to open. The case
// also holds the person's settings files and plugin lists to their bytes.
//
// The second is asked to append to a file with one shell command, which a
// proofer's grant and a sealer's refuse: the case reads the stream for the
// session's tools, the request and the refusal, and the file for its bytes.
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
import type { HeadlessInfo, RoleStage, ServerMessage } from "../src/shared/protocol";
import { buildApp } from "./built-app";
import { temporaryRepository } from "./repositories";

/** The run, started by `pnpm run role:run`. */
const RUN = process.env.OWLERY_ROLE_RUN === "1";
/** The pair the run's session is launched as: the proofer at a round. */
const PROOFER: RoleStage = { role: "proofer", stage: "round" };
/** The pair of the refused call: the proofer's for `pnpm run role:refusal`, whose script sets the variable to `1`, and the sealer's for `pnpm run role:refusal:sealer`, whose script sets it to `sealer`. Undefined where neither script started the file. */
const REFUSED: RoleStage | undefined = ({ "1": PROOFER, sealer: { role: "sealer", stage: "seal" } } as Record<string, RoleStage>)[process.env.OWLERY_ROLE_REFUSAL ?? ""];
/** The refused call, started by one of those two scripts. */
const REFUSAL = REFUSED !== undefined;

/** The files a role session must leave as they were: the person's settings, and the lists of the plugins and marketplaces they installed. */
const UNCHANGED = [".claude/settings.json", ".claude/settings.local.json", ".claude/plugins/installed_plugins.json", ".claude/plugins/known_marketplaces.json"];

const PROMPT = [
  "Answer these three questions in three short numbered lines, and do nothing else: run no command and write no file.",
  "1. Your definition names the file the daemon writes your round record to. Quote that path exactly as your definition writes it.",
  "2. Which rule numbers of the agent contract are retired? Quote the numbers as the contract lists them.",
  "3. Read the file `templates/records/sdd-round.md` of the role bundle, and quote its first line exactly.",
].join("\n");

/** The command the second session is asked to run: it appends one byte to a tracked file, so it is no command Claude Code runs unasked. */
const APPEND = "printf x >> README.md";

const REFUSAL_PROMPT = [`Run this one shell command with your Bash tool, exactly as written, in the folder you work in: \`${APPEND}\``, "Make that one call and no other. Then say in one line what happened, and stop."].join("\n");

describe.skipIf(!RUN && !REFUSAL)("a real role session, on the person's own Claude login", () => {
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

  /** Launches one session as the pair given on `prompt`, in a work item of a scratch repository, and gives the session as it ended, the lines of its output stream, every message the daemon sent, and the work item's folder. */
  async function launched(prompt: string, role: RoleStage): Promise<{ headless: HeadlessInfo; lines: Record<string, unknown>[]; messages: ServerMessage[]; worktree: string }> {
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
    // The daemon also runs the CLI at its start, to read its version, and that run's output is no part of the stream.
    const copying = script("claude-copying", `if [ "$*" = "--version" ]; then exec '${cli}' --version; fi\n'${cli}' "$@" | tee '${stream}'`);
    const shell = script("shell", `printf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n' '${copying}' '${path}'`);

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
    client.send(JSON.stringify({ type: "ask", requestId: 2, workItemId: workItem.id, prompt, role }));
    const headless: HeadlessInfo = (await message("headless", (m) => m.headless.state !== "working", 280_000)).headless;

    // What the run's record is written from: the session as the daemon holds it, and what its result line says it cost.
    const lines = (existsSync(stream) ? readFileSync(stream, "utf8").split("\n").filter(Boolean) : []).map((line) => JSON.parse(line) as Record<string, unknown>);
    const result = lines.find((line) => line.type === "result");
    console.log(JSON.stringify({ kept, headless, usage: result?.usage, modelUsage: result?.modelUsage, permissionDenials: result?.permission_denials, numTurns: result?.num_turns }, null, 2));
    return { headless, lines, messages, worktree: workItem.worktree };
  }

  it.skipIf(!RUN)("answers from its definition, from the appended rules and from a file of the bundle, and changes no settings file and no plugin list", async () => {
    const before = bytes();
    const { headless } = await launched(PROMPT, PROOFER);
    const after = bytes();

    expect([headless.state, headless.error, headless.role]).toEqual(["finished", null, { role: "proofer", stage: "round" }]);
    // Only `agents/proofer.md` states this path.
    expect(headless.answer).toContain("trail/rounds/round-<n>.md");
    // Only `skills/agent-contract/SKILL.md` states the retired numbers.
    expect(headless.answer).toMatch(/8, 16,? and 20/);
    // The first line of `templates/records/sdd-round.md`, which no appended document holds.
    expect(headless.answer).toContain("# Review round <N>");
    expect(after).toEqual(before);
  }, 300_000);

  it.skipIf(!REFUSAL)("holds the tools of its grant alone, and is refused a command that would change a file: the request reaches the daemon, the daemon's rule refuses it, and the file keeps its bytes", async () => {
    const pair = REFUSED ?? PROOFER;
    const { headless, lines, messages, worktree } = await launched(REFUSAL_PROMPT, pair);
    const text = lines.map((line) => JSON.stringify(line)).join("\n");
    console.log(JSON.stringify({ types: lines.map((line) => (line.type === "control_request" ? `control_request:${String((line.request as { subtype?: unknown } | undefined)?.subtype)}` : line.type)), toolResults: lines.filter((line) => line.type === "user") }, null, 2));

    // The session's first line lists the four tools of the pair's grant, a proofer's and a sealer's alike, and no other.
    const init = lines.find((line) => line.type === "system" && line.subtype === "init") as { tools?: string[]; permissionMode?: string } | undefined;
    expect([...(init?.tools ?? [])].sort()).toEqual(["Bash", "Glob", "Grep", "Read"]);
    expect(init?.permissionMode).toBe("default");
    // The call reached the daemon as a request, on the session's output stream.
    const requests = lines.filter((line) => line.type === "control_request").map((line) => line.request as { subtype?: string; tool_name?: string; input?: { command?: string } });
    expect(requests.filter((request) => request.subtype === "can_use_tool").map((request) => request.tool_name)).toContain("Bash");
    // The session was told the reason of its role's refused command, which only the daemon's rule states.
    expect(text).toContain(`Owlery gives the ${pair.role} no command that asks for permission.`);
    // Nothing was appended.
    expect(readFileSync(join(worktree, "README.md"), "utf8")).toBe("a repository\n");
    expect([headless.state, headless.error, headless.role]).toEqual(["finished", null, pair]);
    // A role session's request never waits for the person.
    expect(messages.flatMap((m) => (m.type === "inbox" || m.type === "ready" ? m.workItems.flatMap((item) => item.permissions) : []))).toEqual([]);
  }, 300_000);
});
