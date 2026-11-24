// Role sessions of the person's own `claude`, launched by the daemon as a
// role at its stage with the built bundle. The suite runs neither case:
// `pnpm run role:run` sets `OWLERY_ROLE_RUN` and takes the first, and
// `pnpm run role:refusal` and `pnpm run role:refusal:sealer` set
// `OWLERY_ROLE_REFUSAL` and take the second, as the proofer at a round and
// as the sealer at the seal. Without either variable the file runs nothing.
//
// The first case is a real session on the person's login, as the proofer at
// a round, and costs the person's usage. It is asked three things it can
// answer only from what a role launch gives it: one from its definition, one
// from the rules the daemon appended, and one from a file of the bundle it
// has to open. The case also holds the person's settings files and plugin
// lists to their bytes.
//
// The second runs the real CLI against a stand-in for the model on the
// loopback (`model-stand-in.ts`), with a key that is no key and a home and a
// config folder of its own, so it costs nothing and reads no file of the
// person's Claude Code folder. The stand-in answers the session's first turn
// with one shell command that appends to a file, which a proofer's grant and
// a sealer's refuse, so the call is made whatever a model would choose. The
// case reads the stream for the session's tools and the request, what the
// stand-in was told of the refusal, and the file for its bytes.
import { execFile } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
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
import { startModelStandIn, toolResults } from "./model-stand-in";
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

/** The command of the stand-in model's call in the second session: it appends one byte to a tracked file, so it is no command Claude Code runs unasked. */
const APPEND = "printf x >> README.md";

describe.skipIf(!RUN && !REFUSAL)("a role session of the person's own claude: a real one on their login, and one against a stand-in model that costs nothing", () => {
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

  /**
   * Launches one session as the pair given on `prompt`, in a work item of a scratch repository, and gives the session as
   * it ended, the lines of its output stream, every message the daemon sent, and the work item's folder. `model` is a
   * stand-in model's address: given, every run of the CLI the daemon makes goes to it with a key that is no key, and
   * under a home and a config folder of the kept folder's.
   */
  async function launched(prompt: string, role: RoleStage, model?: string): Promise<{ headless: HeadlessInfo; lines: Record<string, unknown>[]; messages: ServerMessage[]; worktree: string }> {
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
    // Set in the script, because the daemon passes a session none of its own variables, and before the read of the
    // version, so that run takes them too.
    let pointed = "";
    if (model !== undefined) {
      const home = join(kept, "home");
      const config = join(kept, "config");
      mkdirSync(home);
      mkdirSync(config);
      pointed = `export ANTHROPIC_BASE_URL='${model}'\nexport ANTHROPIC_API_KEY='stand-in-key-not-a-secret'\nexport HOME='${home}'\nexport CLAUDE_CONFIG_DIR='${config}'\nexport CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1\n`;
    }
    // The daemon also runs the CLI at its start, to read its version, and that run's output is no part of the stream.
    const copying = script("claude-copying", `${pointed}if [ "$*" = "--version" ]; then exec '${cli}' --version; fi\n'${cli}' "$@" | tee '${stream}'`);
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

  it.skipIf(!REFUSAL)("runs the real CLI against a stand-in model, at no cost, and holds the tools of its grant alone: the stand-in's command that would change a file reaches the daemon as a request, the daemon's rule refuses it, the model is told why, and the file keeps its bytes", async () => {
    const pair = REFUSED ?? PROOFER;
    const model = await startModelStandIn(APPEND);
    let ended: Awaited<ReturnType<typeof launched>>;
    try {
      ended = await launched("Review the round.", pair, model.url);
    } finally {
      await model.close();
    }
    const { headless, lines, messages, worktree } = ended;
    const init = lines.find((line) => line.type === "system" && line.subtype === "init") as { tools?: string[]; permissionMode?: string; apiKeySource?: string; claude_code_version?: string } | undefined;
    const told = model.received.flatMap((request) => toolResults(request.body)).map((result) => ({ isError: result.is_error, content: typeof result.content === "string" ? result.content : JSON.stringify(result.content) }));
    console.log(
      JSON.stringify(
        {
          version: init?.claude_code_version,
          types: lines.map((line) => (line.type === "control_request" ? `control_request:${String((line.request as { subtype?: unknown } | undefined)?.subtype)}` : line.type)),
          toolResults: lines.filter((line) => line.type === "user"),
          received: model.received.map((request) => ({ method: request.method, path: request.path, tools: Array.isArray(request.body?.tools) ? (request.body.tools as { name?: unknown }[]).map((tool) => tool.name) : null, toolResults: toolResults(request.body) })),
        },
        null,
        2,
      ),
    );

    // The session's first line lists the four tools of the pair's grant, a proofer's and a sealer's alike, and no other, and names the placeholder key as the one it runs on, so no login of the person's.
    expect([...(init?.tools ?? [])].sort()).toEqual(["Bash", "Glob", "Grep", "Read"]);
    expect(init?.permissionMode).toBe("default");
    expect(init?.apiKeySource).toBe("ANTHROPIC_API_KEY");
    // The stand-in was asked for the session's turns. Where it was not, the call below was never made, and nothing the case reads says anything of the daemon.
    const asked = model.received.filter((request) => request.method === "POST" && new URL(request.path, "http://stand-in").pathname === "/v1/messages");
    expect(asked.length, "the CLI did not reach the stand-in model").toBeGreaterThan(0);
    // The stand-in's call reached the daemon as a request, on the session's output stream.
    const requests = lines.filter((line) => line.type === "control_request").map((line) => line.request as { subtype?: string; tool_name?: string; input?: { command?: string } });
    expect(requests.filter((request) => request.subtype === "can_use_tool").map((request) => ({ tool: request.tool_name, command: request.input?.command }))).toContainEqual({ tool: "Bash", command: APPEND });
    // The model was told, as a call that failed, the reason of its role's refused command, which only the daemon's rule states.
    expect(told).toContainEqual({ isError: true, content: expect.stringContaining(`Owlery gives the ${pair.role} no command that asks for permission.`) });
    // Nothing was appended.
    expect(readFileSync(join(worktree, "README.md"), "utf8")).toBe("a repository\n");
    expect([headless.state, headless.error, headless.role]).toEqual(["finished", null, pair]);
    // A role session's request never waits for the person.
    expect(messages.flatMap((m) => (m.type === "inbox" || m.type === "ready" ? m.workItems.flatMap((item) => item.permissions) : []))).toEqual([]);
  }, 300_000);
});
