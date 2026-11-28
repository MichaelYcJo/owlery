// Role sessions of the person's own `claude`, launched by the daemon as a
// role at its stage with the built bundle. The suite runs neither case:
// `pnpm run role:run` sets `OWLERY_ROLE_RUN` and takes the first, and
// `pnpm run role:refusal`, `pnpm run role:refusal:inspector` and
// `pnpm run role:refusal:crafter` set `OWLERY_ROLE_REFUSAL` and take the
// second, as the proofer at a round, the inspector at the inspection and the crafter
// at a fix pass. Without either variable the file runs nothing. Where
// `OWLERY_ROLE_CLI` names a `claude` binary, such as one of
// `~/.local/share/claude/versions/`, the daemon's runs take it in place of
// the one the login shell finds, so a run shows what an older version does.
//
// The first case is a real session on the person's login, as the proofer at
// a round, and costs the person's usage. It is asked three things it can
// answer only from what a role launch gives it: one from its definition, one
// from the rules the daemon appended, and one from a file of the bundle it
// has to open. The case also holds the person's settings files and plugin
// lists to their bytes.
//
// The second runs the real CLI against a stand-in for the model on the
// loopback (`model-stand-in.ts`), with a key that is no key and a home of its
// own, and the daemon takes a config folder of the case's as System
// default's, so the CLI costs nothing and reads no file of the person's
// Claude Code folder. The daemon is given a run folder of the case's, which
// holds that config folder as it holds the folder the daemon makes for an
// added account. The case's config folder holds `shell-snapshots` as a
// folder Claude Code makes there; in an account's folder that Owlery made
// it is a link into the person's own config folder where the person's holds
// one (`claude-accounts.ts#LINKED_NAMES`), which the case does not try. The
// case writes the daemon's port and token into its `daemon.json` as the
// daemon's start does. The stand-in answers the session's first turn with
// one shell command, so the call is made whatever a model would choose. The
// daemon allows it by the role's grant, and the command runs in Claude
// Code's sandbox with the places the daemon gave the launch: a proofer's and a
// inspector's command clones the worktree into the session's scratch folder,
// appends to the clone's file, makes a branch in the repository's git folder
// and appends to the worktree's file; a crafter's appends to the worktree's
// file, commits it, appends to a file of the case's folder outside the
// worktree, and then writes the worktree's `.git` file and the `commondir`
// of the worktree's own git folder to name the case's folder; and every
// role's command then makes a symbolic link to the run folder's
// `daemon.json` in the place the role's commands write, calls a function
// the shell setup of the case's home defines, and reads that file. The
// system refuses each write after the first two of a proofer and an inspector,
// each after the first two of a crafter, and the read of every role, and the
// function runs, since Claude Code starts each command from its snapshot of
// that setup, which stands in the config folder and which the launch gives
// back the read of. The stand-in then makes the file tools' reads of the run
// folder, one a turn (`fileReads`): a `Read` of `daemon.json` by its path and
// one through the link, a `Grep` and a `Glob`. A file tool reads in Claude
// Code's own process, which no sandbox holds, so what keeps the token from
// it is that Claude Code asks the daemon before each of those reads, the run
// folder standing outside the session's folders, and the daemon refuses each
// by the role's rule. The case reads the stream for the session's tools and
// the requests, the case's config folder for the session's conversation,
// what the stand-in was told each call gave, and the files and the
// worktree's commits for what was written.
import { execFile } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, sep } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import WebSocket from "ws";
import { claudeAdapter, lookupCommand, parseLookup } from "../src/daemon/adapters/claude";
import { toolsOf } from "../src/daemon/adapters/claude-roles";
import { Daemon } from "../src/daemon/daemon";
import { writeDiscovery } from "../src/daemon/discovery";
import { PANE_KINDS } from "../src/daemon/pane-kinds";
import { terminalEnv } from "../src/daemon/pty";
import type { HeadlessInfo, RoleStage, ServerMessage } from "../src/shared/protocol";
import { buildApp } from "./built-app";
import { type StandInCall, startModelStandIn, toolResults } from "./model-stand-in";
import { git, temporaryRepository } from "./repositories";

/** The run, started by `pnpm run role:run`. */
const RUN = process.env.OWLERY_ROLE_RUN === "1";
/** The pair the run's session is launched as: the proofer at a round. */
const PROOFER: RoleStage = { role: "proofer", stage: "round" };
/** The pair of the run whose last write the system refuses: the proofer's for `pnpm run role:refusal`, whose script sets the variable to `1`, the inspector's for `pnpm run role:refusal:inspector`, whose script sets it to `inspector`, and the crafter's for `pnpm run role:refusal:crafter`, whose script sets it to `crafter`. Undefined where none of the three started the file. */
const REFUSED: RoleStage | undefined = ({ "1": PROOFER, inspector: { role: "inspector", stage: "inspection" }, crafter: { role: "crafter", stage: "fix-pass" } } as Record<string, RoleStage>)[process.env.OWLERY_ROLE_REFUSAL ?? ""];
/** The refused write, started by one of those three scripts. */
const REFUSAL = REFUSED !== undefined;

/** The files a role session must leave as they were: the person's settings, and the lists of the plugins and marketplaces they installed. */
const UNCHANGED = [".claude/settings.json", ".claude/settings.local.json", ".claude/plugins/installed_plugins.json", ".claude/plugins/known_marketplaces.json"];

const PROMPT = [
  "Answer these three questions in three short numbered lines, and do nothing else: run no command and write no file.",
  "1. Your definition names the file the daemon writes your round record to. Quote that path exactly as your definition writes it.",
  "2. Which rule numbers of the agent contract are retired? Quote the numbers as the contract lists them.",
  "3. Read the file `templates/records/sdd-round.md` of the role bundle, and quote its first line exactly.",
].join("\n");

/** The daemon's token, which the case writes into the run folder's `daemon.json` and no command may read. */
const TOKEN = "r".repeat(64);

/** What the function the case's home defines in its shell setup prints, which a command prints only where it started from Claude Code's snapshot of that setup. */
const SETUP_RAN = "the shell setup of the home ran";

/** The shell setup of the case's home: one function, which the stand-in's command calls. */
const SHELL_SETUP = `owlery_shell_setup() { printf '%s\\n' '${SETUP_RAN}'; }\n`;

/** The run folder the case gives the daemon, in the case's own folder `kept`. */
const runFolderIn = (kept: string): string => join(kept, "run");

/** The place the pair's commands write, for its work item's worktree and the case's own folder `kept`: a crafter's worktree, and a proofer's and an inspector's scratch folder, which the CLI was given last after `--add-dir` and the case's script kept in `args`. */
const placeOf = (pair: RoleStage, worktree: string, kept: string): string => (pair.role === "crafter" ? worktree : (readFileSync(join(kept, "args"), "utf8").trimEnd().split("\n").at(-1) ?? ""));

/** The symbolic link to the run folder's `daemon.json` that the stand-in's command makes in `place`. */
const linkIn = (place: string): string => join(place, "daemon-link");

/**
 * The command of the stand-in model's first call in the second session, for the
 * pair, its work item's worktree and the case's own folder `kept`. None of
 * them is one Claude Code runs unasked. A proofer's and an inspector's clones the
 * worktree into the scratch folder (`placeOf`), appends a byte to the
 * clone's `README.md` and prints it, then makes the branch `probe` in the
 * repository's git folder, and then, whatever that did, appends a byte to
 * the worktree's `README.md`. A crafter's appends a byte to the worktree's
 * `README.md`, commits it as `probe`, then appends one to `outside.txt` of
 * `kept`, which no place of the launch names, and then, whatever each step
 * did, points git at `kept` twice: through the worktree's `.git` file, and
 * through `commondir` of the worktree's own git folder, both inside the
 * places a crafter writes. Every role's then, whatever the steps before
 * did, makes the link `linkIn` to the run folder's `daemon.json` in the
 * place its commands write, for the stand-in's `Read` through it, calls the
 * function of the home's shell setup, and last prints that file, so the
 * command fails where the read is refused. The paths of the case hold no
 * quote.
 */
function standInCommand(pair: RoleStage, worktree: string, kept: string): string {
  const daemonFile = join(runFolderIn(kept), "daemon.json");
  const place = placeOf(pair, worktree, kept);
  const discovery = `ln -s '${daemonFile}' '${linkIn(place)}'; owlery_shell_setup; cat '${daemonFile}'`;
  if (pair.role === "crafter") return `printf x >> '${worktree}/README.md' && git -C '${worktree}' commit -qam probe && printf x >> '${kept}/outside.txt'; printf 'gitdir: %s\\n' '${kept}' > '${worktree}/.git'; printf '%s\\n' '${kept}' > "$(git -C '${worktree}' rev-parse --path-format=absolute --git-dir)/commondir"; ${discovery}`;
  return `git clone -q --no-local '${worktree}' '${place}/clone' && printf x >> '${place}/clone/README.md' && cat '${place}/clone/README.md' && { git -C '${worktree}' branch probe; printf x >> '${worktree}/README.md'; }; ${discovery}`;
}

/**
 * The stand-in's calls after the command, one a turn, each a file tool's read of the run folder, which every role
 * holds: a `Read` of `daemon.json` by its path, a `Read` through the link the command made, a `Grep` of the run folder
 * for the token's key, and a `Glob` of its JSON files.
 */
function fileReads(pair: RoleStage, worktree: string, kept: string): StandInCall[] {
  const run = runFolderIn(kept);
  return [
    { name: "Read", input: { file_path: join(run, "daemon.json") } },
    { name: "Read", input: { file_path: linkIn(placeOf(pair, worktree, kept)) } },
    { name: "Grep", input: { pattern: "token", path: run, output_mode: "content" } },
    { name: "Glob", input: { pattern: "*.json", path: run } },
  ];
}

/** A sentence that the system refused a write to or a read of `file`, in the words of either shell and of `cat`: zsh's "operation not permitted: <file>", and bash's and `cat`'s "<file>: Operation not permitted". */
function refused(file: string): RegExp {
  const name = file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`operation not permitted: ${name}|${name}: operation not permitted`, "i");
}

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
   * it ended, the lines of its output stream, every message the daemon sent, the work item's folder, and the case's
   * config folder. `model` is a stand-in model's address: given, every run of the CLI the daemon makes goes to it with a
   * key that is no key and under a home of the kept folder's, and the daemon takes a config folder of the kept folder's
   * as System default's. Without it, the config folder is null and the launch is the person's own. `placed` is told the
   * worktree and the kept folder before the session starts. What it gives also holds the kept folder and the
   * repository's temporary folder.
   */
  async function launched(prompt: string, role: RoleStage, model?: string, placed?: (worktree: string, kept: string) => void): Promise<{ headless: HeadlessInfo; lines: Record<string, unknown>[]; messages: ServerMessage[]; worktree: string; config: string | null; kept: string; base: string }> {
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
    const { path } = found!;
    const cli = process.env.OWLERY_ROLE_CLI ?? found!.cli;
    const script = (name: string, body: string): string => {
      const file = join(kept, name);
      writeFileSync(file, `#!/bin/sh\n${body}\n`);
      chmodSync(file, 0o755);
      return file;
    };
    // The daemon's run folder, readable by the person alone as the daemon's start makes it.
    const run = runFolderIn(kept);
    mkdirSync(run, { mode: 0o700 });
    // In the run folder, as the folder the daemon makes for an added account is, so the session's commands run where their config folder is one they read nothing of but its shell snapshots.
    const config = model === undefined ? null : join(run, "config");
    // Set in the script, because the daemon passes a session none of its own variables, and before the read of the
    // version, so that run takes them too. The config folder is the daemon's to give, below.
    let pointed = "";
    if (config !== null) {
      const home = join(kept, "home");
      mkdirSync(home);
      mkdirSync(config);
      // The home's shell setup, which Claude Code takes into the snapshot each command of the session starts from: zsh's and bash's.
      for (const file of [".zshrc", ".bashrc"]) writeFileSync(join(home, file), SHELL_SETUP);
      pointed = `export ANTHROPIC_BASE_URL='${model}'\nexport ANTHROPIC_API_KEY='stand-in-key-not-a-secret'\nexport HOME='${home}'\nexport CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1\n`;
    }
    // The daemon also runs the CLI at its start, to read its version, and that run's output is no part of the stream.
    // The session's arguments are kept one to a line in `args`, the folder its launch names last among them.
    const copying = script("claude-copying", `${pointed}if [ "$*" = "--version" ]; then exec '${cli}' --version; fi\nprintf '%s\\n' "$@" > '${join(kept, "args")}'\n'${cli}' "$@" | tee '${stream}'`);
    // With a config folder, the shell's third line names it, as a login shell that exports `CLAUDE_CONFIG_DIR` does: the
    // daemon then takes it as System default's folder and gives it to the session.
    const shell = script("shell", config === null ? `printf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n' '${copying}' '${path}'` : `printf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n__owlery_config=%s\\n' '${copying}' '${path}' '${config}'`);

    const bundleDir = join(__dirname, "..", "dist", "bundle");
    const token = TOKEN;
    daemon = new Daemon({
      token,
      runDir: run,
      paneKinds: PANE_KINDS,
      roleAdapter: claudeAdapter({ ...process.env, SHELL: shell }, { bundleDir, rulesDir: join(run, "roles") }),
      commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 0"], env: {} }),
      worktreesRoot: repository.root,
    });
    const port = await daemon.listen(0);
    // What a client on the loopback reaches the daemon with, where the daemon's start writes it (`main.ts`).
    writeDiscovery(run, { port, token, pid: process.pid });
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
    placed?.(workItem.worktree, kept);
    await daemon.startRoleSession(workItem.id, prompt, role);
    const headless: HeadlessInfo = (await message("headless", (m) => m.headless.state !== "working", 280_000)).headless;

    // What the run's record is written from: the session as the daemon holds it, and what its result line says it cost.
    const lines = (existsSync(stream) ? readFileSync(stream, "utf8").split("\n").filter(Boolean) : []).map((line) => JSON.parse(line) as Record<string, unknown>);
    const result = lines.find((line) => line.type === "result");
    console.log(JSON.stringify({ kept, headless, usage: result?.usage, modelUsage: result?.modelUsage, permissionDenials: result?.permission_denials, numTurns: result?.num_turns }, null, 2));
    return { headless, lines, messages, worktree: workItem.worktree, config, kept, base: repository.base };
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

  it.skipIf(!REFUSAL)("runs the real CLI against a stand-in model, at no cost, and holds the tools of its grant alone: the daemon allows the stand-in's command by the role's grant, the command writes where the role's places let it, and the system refuses its write outside them (#127)", async () => {
    const pair = REFUSED ?? PROOFER;
    let places: { worktree: string; kept: string } | undefined;
    let command = "";
    const model = await startModelStandIn(
      () => {
        command = places === undefined ? "exit 1" : standInCommand(pair, places.worktree, places.kept);
        return command;
      },
      () => (places === undefined ? [] : fileReads(pair, places.worktree, places.kept)),
    );
    let ended: Awaited<ReturnType<typeof launched>>;
    try {
      ended = await launched(pair.role === "crafter" ? "Make the fix pass." : "Review the round.", pair, model.url, (worktree, kept) => {
        places = { worktree, kept };
      });
    } finally {
      await model.close();
    }
    const { headless, lines, worktree, config, kept, base } = ended;
    const init = lines.find((line) => line.type === "system" && line.subtype === "init") as { tools?: string[]; permissionMode?: string; apiKeySource?: string; claude_code_version?: string } | undefined;
    const told = model.received.flatMap((request) => toolResults(request.body)).map((result) => ({ isError: result.is_error, content: typeof result.content === "string" ? result.content : JSON.stringify(result.content) }));
    // What the session left in the worktree and in the folders above it, up to the repository's temporary folder, git's own folder aside.
    const listed = (folder: string): string[] => readdirSync(folder, { recursive: true, encoding: "utf8" }).filter((entry) => entry !== ".git" && !entry.startsWith(`.git${sep}`)).sort();
    const above: Record<string, string[]> = {};
    for (let folder = dirname(worktree); folder.startsWith(base); folder = dirname(folder)) above[folder] = readdirSync(folder).sort();
    console.log(
      JSON.stringify(
        {
          version: init?.claude_code_version,
          command,
          worktree: listed(worktree),
          above,
          status: git(worktree, "status", "--porcelain"),
          types: lines.map((line) => (line.type === "control_request" ? `control_request:${String((line.request as { subtype?: unknown } | undefined)?.subtype)}` : line.type)),
          toolResults: lines.filter((line) => line.type === "user"),
          received: model.received.map((request) => ({ method: request.method, path: request.path, tools: Array.isArray(request.body?.tools) ? (request.body.tools as { name?: unknown }[]).map((tool) => tool.name) : null, toolResults: toolResults(request.body) })),
        },
        null,
        2,
      ),
    );

    // The session's first line lists the tools of the pair's grant and no other, and names the placeholder key as the one it runs on, so no login of the person's.
    expect([...(init?.tools ?? [])].sort()).toEqual([...toolsOf(pair)].sort());
    expect(init?.permissionMode).toBe("default");
    expect(init?.apiKeySource).toBe("ANTHROPIC_API_KEY");
    // The session ran under the case's config folder, which the daemon gave it as System default's, and wrote its conversation there.
    expect(existsSync(join(config ?? "", "projects")), "the session wrote no conversation into the case's config folder").toBe(true);
    // The stand-in was asked for the session's turns. Where it was not, the call below was never made, and nothing the case reads says anything of the daemon.
    const asked = model.received.filter((request) => request.method === "POST" && new URL(request.path, "http://stand-in").pathname === "/v1/messages");
    expect(asked.length, "the CLI did not reach the stand-in model").toBeGreaterThan(0);
    // The stand-in's call reached the daemon as a request, on the session's output stream.
    const requests = lines.filter((line) => line.type === "control_request").map((line) => line.request as { subtype?: string; tool_name?: string; input?: { command?: unknown } });
    expect(command).not.toBe("exit 1");
    expect(requests.filter((request) => request.subtype === "can_use_tool").map((request) => ({ tool: request.tool_name, command: request.input?.command }))).toContainEqual({ tool: "Bash", command });
    // The daemon allowed the call, so the command ran and the model was told what it printed and no rule of the daemon's.
    expect(told.map(({ content }) => content).join("\n")).not.toContain("Owlery gives the");
    // Claude Code asked the daemon before each file tool's read of the run folder, the `Read` through the link among them though the link stands in a folder the session was given, and the daemon refused each by the role's rule.
    const reads = requests.filter((request) => request.subtype === "can_use_tool" && request.tool_name !== "Bash").map((request) => ({ name: request.tool_name, input: request.input }));
    expect(reads).toMatchObject(fileReads(pair, worktree, kept));
    // Each request repeats the tool results of the turns before it, so a refusal is counted once, by the call it answers: the stand-in names the calls after its first from `toolu_stand_in_2` on.
    const refusedCalls = new Set(
      model.received
        .flatMap((request) => toolResults(request.body))
        .filter((result) => result.is_error === true && typeof result.content === "string" && result.content.startsWith(`Owlery's rule for the ${pair.role} does not allow this call.`))
        .map((result) => result.tool_use_id),
    );
    expect([...refusedCalls].sort()).toEqual(fileReads(pair, worktree, kept).map((_call, index) => `toolu_stand_in_${String(index + 2)}`));
    // Every role's command was refused the read of the run folder's `daemon.json`, and no file tool's read of it was let through, so the session was told neither the port nor the token with which a client on the loopback has the daemon act outside the sandbox.
    expect(told.map(({ content }) => content).join("\n")).not.toContain(TOKEN);
    // The command started from Claude Code's snapshot of the home's shell setup, though the config folder's `shell-snapshots` stands inside the run folder, as it does in the folder the daemon makes for an added account, here as a folder of its own and not a link: the launch gives back the read of that folder alone.
    expect(told.map(({ content }) => content).join("\n")).toContain(SETUP_RAN);
    expect(told).toContainEqual({ isError: true, content: expect.stringMatching(refused(join(runFolderIn(kept), "daemon.json"))) });
    if (pair.role === "crafter") {
      // The worktree's file took the byte and the commit holds it; the system refused the write to the case's folder, which no place of the launch names.
      expect(told).toContainEqual({ isError: true, content: expect.stringMatching(refused(join(kept, "outside.txt"))) });
      expect(readFileSync(join(worktree, "README.md"), "utf8")).toBe("a repository\nx");
      expect(git(worktree, "log", "-1", "--format=%s")).toBe("probe\n");
      expect(git(worktree, "show", "--format=", "--name-only", "HEAD")).toBe("README.md\n");
      expect(existsSync(join(kept, "outside.txt"))).toBe(false);
      // The system refused both writes that would point git at a folder of the command's, and git still names the repository's folder: `temporaryRepository` names the case's repository `project` under `base`.
      expect(told).toContainEqual({ isError: true, content: expect.stringMatching(refused(join(worktree, ".git"))) });
      expect(told).toContainEqual({ isError: true, content: expect.stringMatching(/commondir.*operation not permitted|operation not permitted.*commondir/is) });
      expect(git(worktree, "rev-parse", "--path-format=absolute", "--git-common-dir").trim()).toBe(realpathSync(join(base, "project", ".git")));
    } else {
      // The clone in the scratch folder took the byte, which the command printed; the system refused the branch in the repository's git folder and the write to the worktree, and the worktree holds no change.
      expect(told).toContainEqual({ isError: true, content: expect.stringContaining("a repository\nx") });
      expect(told).toContainEqual({ isError: true, content: expect.stringMatching(/refs\/heads\/probe\.lock.*operation not permitted/is) });
      expect(git(worktree, "branch", "--list", "probe")).toBe("");
      expect(told).toContainEqual({ isError: true, content: expect.stringMatching(refused(join(worktree, "README.md"))) });
      expect(readFileSync(join(worktree, "README.md"), "utf8")).toBe("a repository\n");
      expect(git(worktree, "status", "--porcelain")).toBe("");
    }
    expect([headless.state, headless.error, headless.role]).toEqual(["finished", null, pair]);
  }, 300_000);
});
