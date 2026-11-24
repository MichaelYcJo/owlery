// The chain command, which a pane's session runs the owl chain through
// (`src/daemon/chain-command.ts`): each case calls its subcommands in a
// temporary repository, in the case's own process, and reads the commits
// they made. No case starts an agent or reaches a remote.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { BASE_OPTION, USAGE } from "../src/daemon/chain-command";
import { BACK_OPEN, SECTION_OPEN } from "../src/daemon/github";
import { workItemSeal } from "../src/daemon/seal-state";
import { type Cleanups, VERSION, clean, closeFinding, commitAll, commitFix, commitsAfterMain, givenFix, givenRound, givenSeal, head, proofs, roundRecord, sealSection, status, write } from "./chain-run";
import { BRANCH, type Owed, commandOn, sealThrough } from "./chain-command-run";
import { git } from "./repositories";

const cleanups: Cleanups = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

/** The directory the command declares for the cases' branch, from the daemon's clock in the cases. */
const DIRECTORY = "seal/threads/1795388700-greet";

const read = (file: string | undefined): string => readFileSync(file ?? "", "utf8");

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
    expect(text.startsWith(`${SECTION_OPEN}\n## Owlery seal\n`)).toBe(true);
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

  it("refuses a run with no subcommand, an unknown one and an option the subcommand does not take, each with the usage", async () => {
    const on = commandOn(cleanups);
    expect(await on.run([])).toEqual({ code: 1, out: "", err: `The chain command takes a subcommand.\n${USAGE}` });
    expect(await on.run(["press"])).toEqual({ code: 1, out: "", err: `The chain command has no subcommand press.\n${USAGE}` });
    expect(await on.run(["gate", "--force", "yes"])).toEqual({ code: 1, out: "", err: `The subcommand takes no option --force.\n${USAGE}` });
  });
});
