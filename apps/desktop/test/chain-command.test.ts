// The chain command, which a pane's session runs the owl chain through
// (`src/daemon/chain-command.ts`): each case calls its subcommands in a
// temporary repository, in the case's own process, and reads the commits
// they made. No case starts an agent or reaches a remote.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { BASE_RECORDED, earlierRunSays, stoppedSays, twiceFailedWhy } from "../src/daemon/chain";
import { BASE_OPTION, NO_DEFAULT, USAGE, noDaemonSays, waitingSays } from "../src/daemon/chain-command";
import { BROAD_GATE_NAME, MachineTurns } from "../src/daemon/machine-turns";
import { TURN_SOCKET, TurnServer, turnGiver } from "../src/daemon/turn-socket";
import { routingAnswer } from "../src/daemon/decision-record";
import { rulesText } from "../src/daemon/adapters/claude-roles";
import { BACK_OPEN, SECTION_OPEN } from "../src/daemon/github";
import { workItemSeal } from "../src/daemon/seal-state";
import { type Cleanups, VERSION, clean, closeFinding, commitAll, commitFix, commitsAfterMain, givenFix, givenRound, givenSeal, head, proofs, roundRecord, sealSection, status, until, write } from "./chain-run";
import { BRANCH, BUNDLE, type Owed, commandOn, sealThrough } from "./chain-command-run";
import { git } from "./repositories";

const cleanups: Cleanups = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

/** The directory the command declares for the cases' branch, from the daemon's clock in the cases. */
const DIRECTORY = "seal/threads/1795388700-greet";

const read = (file: string | undefined): string => readFileSync(file ?? "", "utf8");


/** The JSON a `PreToolUse` hook's command is handed on its input for an `AskUserQuestion` call that asks these questions. */
const asked = (...questions: string[]): string =>
  JSON.stringify({ hook_event_name: "PreToolUse", tool_name: "AskUserQuestion", tool_input: { questions: questions.map((question) => ({ question, header: "Choice", options: [{ label: "One", description: "The first." }, { label: "Other", description: "The second." }], multiSelect: false })) } });

/** How `ask` ends where it lets the call through. */
const LET_THROUGH = { code: 0, out: "", err: "" };

describe("the chain command", { timeout: 60_000 }, () => {
  it("runs a chain to a seal in the order `owed` names: it declares the routing, hands each role its prompt and rules, commits the round's record, the gate's run and the verdict, and the daemon's reader then reads the head as sealed", async () => {
    const on = commandOn(cleanups);
    expect(await on.said(["owed"])).toEqual({ step: "start" });
    expect(await on.said(["start"])).toMatchObject({ step: "start", directory: DIRECTORY, declared: true });
    expect(read(join(on.repo, DIRECTORY, "routing.md"))).toContain("| Implementation | the session |");

    const round = await on.said(["owed"]);
    const routed = head(on.repo);
    expect(round).toMatchObject({ step: "round", round: 1, target: `${routed} against main`, agent: "owlery:proofer" });
    expect(round.prompt?.startsWith(join(on.runDir, "chain", "1795388700-greet"))).toBe(true);
    expect(givenRound(read(round.prompt))).toEqual({ round: 1, heading: "# Review round 1: 1795388700-greet", target: `${routed} against main` });
    expect(read(round.prompt)).toContain("- `feature.txt`");
    expect(read(round.rules)).toContain("# Owlery role session: proofer, round");
    // The rules are a pane's subagent's: its head names the person's permission settings, and no answer of the daemon.
    expect(read(round.rules)).toBe(rulesText(BUNDLE, { role: "proofer", stage: "round" }, "pane"));
    expect(read(round.rules)).toContain("The person's own permission settings answer every call that asks for permission.");
    expect(await on.said(["round", on.answer("round-1.md", clean(givenRound(read(round.prompt))))])).toMatchObject({ recorded: "round", round: 1, asks: [] });

    const gate = await on.said(["owed"]);
    expect(gate).toEqual({ step: "gate", round: 1, head: head(on.repo) });
    expect(await on.said(["gate"])).toEqual({ recorded: "gate", round: 1, commit: gate.head });
    expect(read(join(on.repo, DIRECTORY, "trail/gate.md"))).toContain(`run: ${gate.head ?? ""} against ${on.main}`);

    const seal = await on.said(["owed"]);
    expect(seal).toMatchObject({ step: "seal", round: 1, run: 1, commit: gate.head, target: `${gate.head ?? ""} against main`, agent: "owlery:sealer" });
    expect(givenSeal(read(seal.prompt))).toEqual({ run: 1, heading: "## Run 1", target: `${gate.head ?? ""} against main` });
    expect(await on.said(["seal", on.answer("seal-1.md", sealSection(givenSeal(read(seal.prompt)))), "--judged-by", "agent-sealer", "--model", "owl-large"])).toEqual({ recorded: "seal", run: 1, verdict: "sealed", says: null, commit: gate.head });

    expect(commitsAfterMain(on.repo).map(({ subject }) => subject)).toEqual(["feat: greet", "chore: declare the work item's routing", "chore: record review round 1", "chore: record the broad gate's run", "chore: record the sealer's verdict"]);
    expect(commitsAfterMain(on.repo).slice(1).map(({ body }) => body)).toEqual(Array.from({ length: 4 }, () => "Seal-Routing: 1795388700-greet"));
    expect(read(join(on.repo, DIRECTORY, "guarantee.md"))).toContain(["Verdict: sealed", "built-by: the session", "judged-by: agent-sealer", "model: owl-large", `rules: owlery ${VERSION}`, "```"].join("\n"));
    expect(await on.said(["owed"])).toEqual({ step: "sealed", round: 1, commit: gate.head });
    expect(await workItemSeal({ worktree: on.repo, branch: BRANCH, baseBranch: "main", baseCommit: on.main }, head(on.repo))).toEqual({ state: "sealed", commit: gate.head, why: null });
    expect(status(on.repo)).toEqual([]);
  });

  it("writes the pull request body's seal section and the back's section into the run folder, the back saying that the stages ran outside the daemon, and refuses a branch with no verdict", async () => {
    const on = commandOn(cleanups);
    await on.said(["start"]);
    const none = await on.run(["body"]);
    expect(none).toMatchObject({ code: 1, out: "" });
    expect(none.err).toBe(`${DIRECTORY}/guarantee.md holds no verdict block at the head commit, so the body has no seal to carry.\n`);
    await git(on.repo, "reset", "--quiet", "--hard", on.built);
    const sealed = await sealThrough(on);
    const { body } = await on.said<{ body: string }>(["body"]);
    expect(body).toBe(join(on.runDir, "chain", "1795388700-greet", "pull-request-body.md"));
    const text = read(body);
    expect(text.startsWith(`${SECTION_OPEN}\n## Seal\n`)).toBe(true);
    expect(text).toContain(`target: ${sealed} against main`);
    expect(text).toContain(`${BACK_OPEN}\n## The back of the seal`);
    expect(text).toContain("ran outside Owlery's daemon");
  });

  it("records a fix pass's close blocks with the pass's session in the `Seal-Built-By` trailer, owes the verifying round, and names that session among the builders of the verdict, which a judging id that is a builder's or `the session` is refused for", async () => {
    const on = commandOn(cleanups);
    await on.said(["start"]);
    const first = await on.said(["owed"]);
    await on.said(["round", on.answer("round-1.md", proofs(givenRound(read(first.prompt))))]);
    const pass = await on.said(["owed"]);
    expect(pass).toMatchObject({ step: "fix-pass", round: 1, open: [1], agent: "owlery:crafter" });
    const { record, open } = givenFix(read(pass.prompt));
    const fix = commitFix(on.repo);
    for (const finding of open) closeFinding(on.repo, record, finding, `fixed ${fix}`);
    const unnamed = await on.run(["fix-pass"]);
    expect(unnamed.code).toBe(1);
    expect(unnamed.err).toContain("`fix-pass` takes `--by` with the id of the subagent that made the pass");
    expect(await on.said(["fix-pass", "--by", "agent-crafter"])).toMatchObject({ recorded: "fix-pass", round: 1, open: [] });
    expect(commitsAfterMain(on.repo).at(-1)).toMatchObject({ subject: "chore: record the fix pass of round 1", body: "Seal-Routing: 1795388700-greet\nSeal-Built-By: agent-crafter" });

    const second = await on.said(["owed"]);
    expect(second).toMatchObject({ step: "round", round: 2, agent: "owlery:proofer" });
    await on.said(["round", on.answer("round-2.md", proofs(givenRound(read(second.prompt))))]);
    await on.said(["gate"]);
    const seal = await on.said(["owed"]);
    const answer = on.answer("seal-1.md", sealSection(givenSeal(read(seal.prompt))));
    const before = head(on.repo);
    const builder = await on.run(["seal", answer, "--judged-by", "agent-crafter", "--model", "owl-large"]);
    expect(builder).toEqual({ code: 1, out: "", err: "The sealer's session failed: the judging session, agent-crafter, is one of the sessions that built the work, and a session that built gives no verdict.\n" });
    const session = await on.run(["seal", answer, "--judged-by", "the session", "--model", "owl-large"]);
    expect(session).toEqual({ code: 1, out: "", err: "The sealer's session failed: the judging session is named `the session`, which names the session that built the work, and a session that built gives no verdict.\n" });
    expect(head(on.repo)).toBe(before);
    expect(status(on.repo)).toEqual([]);
    await on.said(["seal", answer, "--judged-by", "agent-sealer", "--model", "owl-large"]);
    expect(read(join(on.repo, DIRECTORY, "guarantee.md"))).toContain("built-by: the session, agent-crafter\njudged-by: agent-sealer\n");
  });

  it("refuses what the daemon's chain refuses, each with its sentence and with nothing committed: a record the reader refuses, a subcommand for a step the records do not owe, a head that moved after the prompt was handed, and a change outside the work item's directory", async () => {
    const on = commandOn(cleanups);
    await on.said(["start"]);
    const round = await on.said(["owed"]);
    const given = givenRound(read(round.prompt));
    const before = head(on.repo);
    const refused = async (args: string[], says: string): Promise<void> => {
      const end = await on.run(args);
      expect(end, args.join(" ")).toEqual({ code: 1, out: "", err: `${says}\n` });
      expect(head(on.repo), args.join(" ")).toBe(before);
    };

    await refused(["round", on.answer("headed.md", roundRecord("# Review round 2: 1795388700-greet", given.target))], "Review round 1 failed: its record is headed `# Review round 2: 1795388700-greet`, and the round was given `# Review round 1: 1795388700-greet`.");
    await refused(["round", on.answer("none.md", "I found nothing.\n")], "Review round 1 failed: its answer holds no round record: no line of it reads `# Review round 1: 1795388700-greet`.");
    await refused(["gate"], "The records owe review round 1, and `gate` records the broad gate. Ask `owed` for the step.");
    await refused(["seal", on.answer("early.md", sealSection({ heading: "## Run 1", target: given.target })), "--judged-by", "agent-sealer", "--model", "owl-large"], "The records owe review round 1, and `seal` records the seal. Ask `owed` for the step.");
    await refused(["fix-pass", "--by", "the session"], "The records owe review round 1, and `fix-pass` records a fix pass. Ask `owed` for the step.");

    // A file no commit holds, outside the work item's directory.
    writeFileSync(join(on.repo, "loose.txt"), "loose\n");
    await refused(["round", on.answer("clean.md", clean(given))], "Review round 1 failed: the worktree holds a change no commit holds outside the work item's directory, at loose.txt.");
    expect(existsSync(join(on.repo, DIRECTORY, "trail"))).toBe(false);

    // The head moved after `owed` handed the round its target: the record names the tree the proofer read, and the round now owed is another's.
    const moved = commitAll(on.repo, "feat: loose");
    const late = await on.run(["round", on.answer("clean.md", clean(given))]);
    expect(late).toEqual({ code: 1, out: "", err: `Review round 1 failed: its record's target line reads \`${given.target}\`, and the round was given \`${moved} against main\`.\n` });
    expect(head(on.repo)).toBe(moved);
    expect(status(on.repo)).toEqual([]);
  });

  it("refuses a broad gate that fails, with the gate's sentence and what the command printed, and commits no run", async () => {
    const on = commandOn(cleanups, { gate: "echo the suite is red; exit 3" });
    await on.said(["start"]);
    const round = await on.said(["owed"]);
    await on.said(["round", on.answer("round-1.md", clean(givenRound(read(round.prompt))))]);
    const before = head(on.repo);
    expect(await on.run(["gate"])).toEqual({ code: 1, out: "", err: "The broad gate failed: the command exited with code 3.\nthe suite is red\n" });
    expect(head(on.repo)).toBe(before);
    expect(existsSync(join(on.repo, DIRECTORY, "trail/gate.md"))).toBe(false);
    expect(await on.said(["owed"])).toEqual({ step: "gate", round: 1, head: before });
  });

  it("asks the daemon for a turn on the machine before it runs the broad gate: it says it waits while another heavy command holds the turn and starts the command once that ends, and where no daemon answers it runs the gate at once and says so", async () => {
    const owesGate = async (on: ReturnType<typeof commandOn>): Promise<void> => {
      await on.said(["start"]);
      const round = await on.said(["owed"]);
      await on.said(["round", on.answer("round-1.md", clean(givenRound(read(round.prompt))))]);
    };
    const alone = commandOn(cleanups, { gate: 'touch "$HOME/gate.ran"' });
    await owesGate(alone);
    expect(await alone.said(["gate"])).toMatchObject({ recorded: "gate", round: 1 });
    expect(alone.told).toEqual([noDaemonSays(BROAD_GATE_NAME)]);

    const on = commandOn(cleanups, { gate: 'touch "$HOME/gate.ran"' });
    await owesGate(on);
    const turns = new MachineTurns({ limit: 1 });
    const server = await TurnServer.listen(join(on.runDir, TURN_SOCKET), turnGiver(turns, { cores: null, load: () => null }));
    cleanups.push(() => server.close());
    const held = turns.ask({ folder: on.folder, name: "test", place: "build" });
    const gate = on.run(["gate"]);
    await until(() => (on.told.length > 0 ? true : undefined));
    expect(on.told).toEqual([waitingSays(BROAD_GATE_NAME, 0)]);
    expect(turns.queue()).toEqual([
      { folder: on.folder, name: "test", place: "build", since: expect.any(Number), state: "running" },
      { folder: on.repo, name: BROAD_GATE_NAME, place: "gate", since: expect.any(Number), state: "waiting" },
    ]);
    expect(existsSync(join(on.folder, "gate.ran"))).toBe(false);
    (await held.turn)?.end();
    expect(JSON.parse((await gate).out)).toMatchObject({ recorded: "gate", round: 1 });
    expect(existsSync(join(on.folder, "gate.ran"))).toBe(true);
    // The gate's turn ended with its command.
    expect(turns.queue()).toEqual([]);
  });

  it("runs a broad gate that failed while the machine was over its load once more, alone, and commits the pass with the earlier run's sentence, refuses one that failed twice with a sentence that names both runs, and runs one that failed with the machine calm once (scenarios F, G and H)", async () => {
    const load = { now: 9 };
    const answering = async (on: ReturnType<typeof commandOn>, waitMs: number): Promise<MachineTurns> => {
      await on.said(["start"]);
      const round = await on.said(["owed"]);
      await on.said(["round", on.answer("round-1.md", clean(givenRound(read(round.prompt))))]);
      const turns = new MachineTurns({ limit: 1, load: () => load.now });
      const server = await TurnServer.listen(join(on.runDir, TURN_SOCKET), turnGiver(turns, { cores: 4, load: () => load.now, calm: { waitMs, pollMs: 20 } }));
      cleanups.push(() => server.close());
      return turns;
    };
    // The gate runs in this process with no daemon to stop it, so its wait for `go` also ends once the cleanup has removed `$HOME`.
    const once = commandOn(cleanups, { gate: 'if [ -e "$HOME/gate.failed" ]; then exit 0; fi; touch "$HOME/gate.failed"; while [ -d "$HOME" ] && [ ! -e "$HOME/go" ]; do sleep 0.05; done; exit 3' });
    const turns = await answering(once, 20_000);
    const gate = once.run(["gate"]);
    await until(() => (existsSync(join(once.folder, "gate.failed")) ? true : undefined));
    // A command that asks while the first run runs takes the turn after it, and the second run waits for it to end and then for the load.
    const other = turns.ask({ folder: once.folder, name: "test", place: "build" });
    writeFileSync(join(once.folder, "go"), "");
    await until(() => (once.told.length > 0 ? true : undefined));
    expect(once.told).toEqual([waitingSays(BROAD_GATE_NAME, 0)]);
    expect(turns.queue().map(({ name, state }) => [name, state])).toEqual([
      ["test", "running"],
      [BROAD_GATE_NAME, "waiting"],
    ]);
    (await other.turn)?.end();
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(existsSync(join(once.repo, DIRECTORY, "trail/gate.md"))).toBe(false);
    load.now = 3;
    const end = await gate;
    expect(end.code, end.err).toBe(0);
    const record = read(join(once.repo, DIRECTORY, "trail/gate.md"));
    const commit = /run: ([0-9a-f]+) against/u.exec(record)?.[1] ?? "";
    expect(record).toContain(`${earlierRunSays({ commit, ended: "exit code 3", load: 9, cores: 4, beside: 0 })}\n\n`);

    load.now = 9;
    const twice = commandOn(cleanups, { gate: "echo the suite is red; exit 3" });
    await answering(twice, 200);
    const before = head(twice.repo);
    expect(await twice.run(["gate"])).toEqual({ code: 1, out: "", err: `${stoppedSays("gate", 1, twiceFailedWhy("the command exited with code 3", "the command exited with code 3"))}\nthe suite is red\n` });
    expect(head(twice.repo)).toBe(before);

    // The machine calm, a load at the cores or under and nothing beside the run: a gate that failed runs once (scenario G).
    load.now = 1;
    const calm = commandOn(cleanups, { gate: 'touch "$HOME/gate.$$"; echo the suite is red; exit 3' });
    await answering(calm, 200);
    expect(await calm.run(["gate"])).toEqual({ code: 1, out: "", err: `${stoppedSays("gate", 1, "the command exited with code 3")}\nthe suite is red\n` });
    expect(readdirSync(calm.folder).filter((name) => name.startsWith("gate."))).toHaveLength(1);
  });

  it("refuses to start on a branch that left its base, naming the commit or the base and how another is named, and writes nothing: a branch reset onto a line that does not hold the commit it was read against, and a base that shares no commit with the branch", async () => {
    const on = commandOn(cleanups);
    // The commit the branch was cut at, on a line of its own, and another line from `main` that does not hold it, which the branch is reset onto.
    git(on.repo, "checkout", "--quiet", "-b", "release", on.main);
    write(on.repo, "release.txt", "Release\n");
    const cut = commitAll(on.repo, "feat: release");
    git(on.repo, "checkout", "--quiet", "-b", "aside", on.main);
    write(on.repo, "aside.txt", "Aside\n");
    const aside = commitAll(on.repo, "feat: aside");
    git(on.repo, "checkout", "--quiet", BRANCH);
    git(on.repo, "reset", "--quiet", "--hard", aside);
    const left = await on.run(["start"], { OWLERY_BASE: cut });
    expect(left).toEqual({ code: 1, out: "", err: `The branch no longer holds ${cut.slice(0, 7)}, the commit its chain reads it against, so a round has no base to read the branch against. ${BASE_OPTION}\n` });
    // A branch with a history of its own.
    git(on.repo, "checkout", "--quiet", "--orphan", "elsewhere");
    commitAll(on.repo, "feat: elsewhere");
    git(on.repo, "checkout", "--quiet", BRANCH);
    expect(await on.run(["start", "--base", "elsewhere"])).toEqual({ code: 1, out: "", err: `The branch and its base elsewhere share no commit, so a round has no base to read the branch against. ${BASE_OPTION}\n` });
    expect(await on.run(["start", "--base", "nowhere"])).toEqual({ code: 1, out: "", err: `The repository holds no branch and no commit named nowhere, so a round has no base to read the branch against. ${BASE_OPTION}\n` });
    expect((await on.run(["start"], { OWLERY_BASE: undefined })).err).toBe("Nothing names the base the branch is read against: the pane's environment holds no OWLERY_BASE. Name it with `--base <branch or commit>`.\n");
    expect(existsSync(join(on.repo, "seal/threads"))).toBe(false);
    expect(head(on.repo)).toBe(aside);
    // The base named anew starts the chain.
    expect(await on.said(["start", "--base", "main"])).toMatchObject({ declared: true });
  });

  it("refuses a branch that left the commit round 1's record names as its base, with the record's sentence, and commits nothing", async () => {
    const on = commandOn(cleanups);
    git(on.repo, "checkout", "--quiet", "-b", "release", on.main);
    write(on.repo, "release.txt", "Release\n");
    const cut = commitAll(on.repo, "feat: release");
    git(on.repo, "checkout", "--quiet", BRANCH);
    git(on.repo, "rebase", "--quiet", "release");
    const env = { OWLERY_BASE: cut };
    await on.said(["start"], env);
    const first = await on.said(["owed"], env);
    expect(first.target).toBe(`${head(on.repo)} against ${cut}`);
    await on.said(["round", on.answer("round-1.md", clean(givenRound(read(first.prompt))))], env);
    // The branch, its records with it, moved onto a line that does not hold the recorded commit.
    git(on.repo, "checkout", "--quiet", "-b", "aside", on.main);
    write(on.repo, "aside.txt", "Aside\n");
    commitAll(on.repo, "feat: aside");
    git(on.repo, "checkout", "--quiet", BRANCH);
    git(on.repo, "rebase", "--quiet", "--onto", "aside", cut, BRANCH);
    const moved = head(on.repo);
    expect(await on.run(["owed"], env)).toEqual({ code: 1, out: "", err: `The branch no longer holds ${cut.slice(0, 7)}, the commit its chain reads it against, so a round has no base to read the branch against. ${BASE_RECORDED}\n` });
    expect(head(on.repo)).toBe(moved);
  });

  it("refuses a start the daemon's chain refuses, each with the daemon's sentence and with no directory made: a records root that names no broad gate, a change no commit holds, a branch with no commit after its base, and a worktree whose HEAD names no branch yet, with what makes one", async () => {
    const gateless = commandOn(cleanups, { gate: " " });
    expect(await gateless.run(["start"])).toEqual({ code: 1, out: "", err: 'seal/config.json of the worktree names no command under "Broad gate", so no broad gate can run on this branch and no seal can be given. Name the repository\'s check there, and commit it.\n' });
    const on = commandOn(cleanups);
    writeFileSync(join(on.repo, "loose.txt"), "loose\n");
    expect(await on.run(["start"])).toEqual({ code: 1, out: "", err: "The worktree holds a change no commit holds, at loose.txt. A round reads a committed tree: commit the change or remove it first.\n" });
    git(on.repo, "clean", "--quiet", "-f");
    expect(await on.run(["start", "--base", BRANCH])).toEqual({ code: 1, out: "", err: "The branch holds no commit after its base, so a round has nothing to read.\n" });
    const detached = commandOn(cleanups);
    git(detached.repo, "checkout", "--quiet", "--detach");
    expect(await detached.run(["start"])).toEqual({ code: 1, out: "", err: "The worktree's HEAD names no branch yet. Owlery makes the work item's branch at its first commit, within a few seconds while Owlery's window is open; run the command again once it has.\n" });
    for (const { repo } of [gateless, on, detached]) expect(existsSync(join(repo, "seal/threads"))).toBe(false);
  });

  it("follows the base round 1's record names, whatever the pane's environment names afterwards: the verifying round and the seal are read against it, and the seal's target names it", async () => {
    const on = commandOn(cleanups);
    git(on.repo, "branch", "release/x", on.main);
    await on.said(["start", "--base", "release/x"]);
    const first = await on.said(["owed", "--base", "release/x"]);
    expect(first.target).toBe(`${head(on.repo)} against release/x`);
    await on.said(["round", on.answer("round-1.md", proofs(givenRound(read(first.prompt)))), "--base", "release/x"]);
    // From here nothing names `release/x` but the record: the environment names `main`, which is removed.
    git(on.repo, "branch", "--quiet", "-D", "main");
    const pass = await on.said(["owed"]);
    const { record, open } = givenFix(read(pass.prompt));
    const fix = commitFix(on.repo);
    for (const finding of open) closeFinding(on.repo, record, finding, `fixed ${fix}`);
    await on.said(["fix-pass", "--by", "the session"]);
    const second = await on.said(["owed"]);
    expect(second).toMatchObject({ step: "round", round: 2 });
    await on.said(["round", on.answer("round-2.md", proofs(givenRound(read(second.prompt))))]);
    await on.said(["gate"]);
    const seal = await on.said<Owed>(["owed"]);
    expect(seal.target).toBe(`${seal.commit ?? ""} against release/x`);
    expect(read(seal.prompt)).toContain("The branch changed these paths since it left its base:\n- `feature.txt`");
  });

  it("goes on where the base branch round 1's record names gained a commit the branch does not hold, reading the branch from the commit the two last shared", async () => {
    const on = commandOn(cleanups);
    git(on.repo, "branch", "release/x", on.main);
    await on.said(["start", "--base", "release/x"]);
    const first = await on.said(["owed", "--base", "release/x"]);
    await on.said(["round", on.answer("round-1.md", clean(givenRound(read(first.prompt)))), "--base", "release/x"]);
    // Another pull request merges into the base branch after round 1, and this branch does not take it.
    git(on.repo, "checkout", "--quiet", "release/x");
    write(on.repo, "other.txt", "Another work item\n");
    commitAll(on.repo, "feat: another work item");
    git(on.repo, "checkout", "--quiet", BRANCH);
    expect(await on.said(["owed"])).toEqual({ step: "gate", round: 1, head: head(on.repo) });
    await on.said(["gate"]);
    const seal = await on.said<Owed>(["owed"]);
    expect(seal.target).toBe(`${seal.commit ?? ""} against release/x`);
    expect(read(seal.prompt)).not.toContain("other.txt");
  });

  it("writes the routing's `Automation` row with the answer `start` is given and none where it is given none, and refuses an answer other than `yes` and `no` and an answer a standing routing does not hold", async () => {
    const on = commandOn(cleanups);
    expect(await on.run(["start", "--automation", "maybe"])).toEqual({ code: 1, out: "", err: "`start` takes `--automation` with `yes` or `no`: whether the run goes on without stopping for a question.\n" });
    expect(existsSync(join(on.repo, "seal/threads"))).toBe(false);
    expect(await on.said(["start", "--automation", "yes"])).toMatchObject({ step: "start", directory: DIRECTORY, declared: true });
    const routing = read(join(on.repo, DIRECTORY, "routing.md"));
    expect(routing).toContain("| Implementation | the session |\n| Automation | yes |\n| Branch | feat/greet |\n");
    expect(routing).toContain("The session that started the chain gave the answer on `Automation`.");
    expect(commitsAfterMain(on.repo).map(({ subject }) => subject)).toEqual(["feat: greet", "chore: declare the work item's routing"]);
    // A routing that stands is written by no start: the answer it holds passes, and another is refused.
    const before = head(on.repo);
    expect(await on.said(["start", "--automation", "yes"])).toMatchObject({ declared: false });
    expect(await on.run(["start", "--automation", "no"])).toEqual({ code: 1, out: "", err: `${DIRECTORY}/routing.md stands and answers \`Automation\` \`yes\`, and \`start\` writes a routing only where none names the branch. Change the row in that file and commit it.\n` });

    const plain = commandOn(cleanups);
    await plain.said(["start"]);
    expect(routingAnswer(read(join(plain.repo, DIRECTORY, "routing.md")), "Automation")).toBeNull();
    expect(read(join(plain.repo, DIRECTORY, "routing.md"))).not.toContain("Automation");
    expect(await plain.run(["start", "--automation", "yes"])).toEqual({ code: 1, out: "", err: `${DIRECTORY}/routing.md stands and holds no \`Automation\` row, and \`start\` writes a routing only where none names the branch. Change the row in that file and commit it.\n` });
    const no = commandOn(cleanups);
    await no.said(["start", "--automation", "no"]);
    expect(routingAnswer(read(join(no.repo, DIRECTORY, "routing.md")), "Automation")).toBe("no");
    expect(head(on.repo)).toBe(before);
    for (const { repo } of [on, plain, no]) expect(status(repo)).toEqual([]);
  });

  it("refuses an `AskUserQuestion` call where the work item's routing answers `Automation` `yes`, with exit code 2 and the reason on its error output, lets a call through where one of its questions opens with `No default can be taken: ` and a reason, and decides nothing on an input it cannot read", async () => {
    const on = commandOn(cleanups);
    await on.said(["start", "--automation", "yes"]);
    const before = head(on.repo);
    const refused = {
      code: 2,
      out: "",
      err: `${DIRECTORY}/routing.md answers \`Automation\` \`yes\`, so this run does not stop for a question. Go on with the question's default, and write the question with that default as a row of ${DIRECTORY}/frame/questions.md. Where no default can be taken, ask again with the question opening \`${NO_DEFAULT}\` and the reason after those words.\n`,
    };
    expect(await on.run(["ask"], {}, asked("Which base does the round read the branch against?"))).toEqual(refused);
    expect(await on.run(["ask"], {}, asked("Which base?", "Which model judges?"))).toEqual(refused);
    // The form: one question of the call that opens with the words and gives a reason.
    expect(NO_DEFAULT).toBe("No default can be taken: ");
    expect(await on.run(["ask"], {}, asked("Which base?", `${NO_DEFAULT}a push needs the person's approval, and no document gives it. May the branch be pushed?`))).toEqual(LET_THROUGH);
    // The words with no reason after them, and the words after the question's opening, are not the form.
    expect(await on.run(["ask"], {}, asked(`${NO_DEFAULT} `))).toEqual(refused);
    expect(await on.run(["ask"], {}, asked(`May the branch be pushed? ${NO_DEFAULT}a push needs the person's approval.`))).toEqual(refused);
    // An input that is no event of the call is named as not read, with a code that refuses nothing.
    for (const input of ["", "not JSON", JSON.stringify({ tool_name: "AskUserQuestion", tool_input: { questions: "Which base?" } }), JSON.stringify({ tool_input: { questions: [{ header: "Choice" }] } })]) {
      expect(await on.run(["ask"], {}, input), input).toEqual({ code: 1, out: "", err: "The input of `ask` is not the event of an `AskUserQuestion` call, a JSON object whose `tool_input.questions` holds each question's text, so `ask` decides nothing on it.\n" });
    }
    expect(head(on.repo)).toBe(before);
    expect(status(on.repo)).toEqual([]);
  });

  it("lets an `AskUserQuestion` call through where no directory names the branch, where the routing holds no `Automation` row, where the row reads `no`, where two directories name the branch, where the worktree's HEAD names no branch, and outside every worktree", async () => {
    const question = asked("Which base does the round read the branch against?");
    const on = commandOn(cleanups);
    expect(await on.run(["ask"], {}, question)).toEqual(LET_THROUGH);
    await on.said(["start"]);
    expect(await on.run(["ask"], {}, question)).toEqual(LET_THROUGH);

    const no = commandOn(cleanups);
    await no.said(["start", "--automation", "no"]);
    expect(await no.run(["ask"], {}, question)).toEqual(LET_THROUGH);

    const yes = commandOn(cleanups);
    await yes.said(["start", "--automation", "yes"]);
    expect((await yes.run(["ask"], {}, question)).code).toBe(2);
    expect(await yes.run(["ask"], {}, question, yes.folder)).toEqual(LET_THROUGH);
    git(yes.repo, "checkout", "--quiet", "--detach");
    expect(await yes.run(["ask"], {}, question)).toEqual(LET_THROUGH);
    git(yes.repo, "checkout", "--quiet", BRANCH);
    write(yes.repo, "seal/threads/2-twin/routing.md", read(join(yes.repo, DIRECTORY, "routing.md")));
    expect(await yes.run(["ask"], {}, question)).toEqual(LET_THROUGH);
  });

  it("refuses a run with no subcommand, an unknown one and an option the subcommand does not take, each with the usage", async () => {
    const on = commandOn(cleanups);
    expect(await on.run([])).toEqual({ code: 1, out: "", err: `The chain command takes a subcommand.\n${USAGE}` });
    expect(await on.run(["press"])).toEqual({ code: 1, out: "", err: `The chain command has no subcommand press.\n${USAGE}` });
    expect(await on.run(["gate", "--force", "yes"])).toEqual({ code: 1, out: "", err: `The subcommand takes no option --force.\n${USAGE}` });
  });
});
