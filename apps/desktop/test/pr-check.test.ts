// The pull request check: the scripts under `pr-check/` at the top of the
// repository, which the workflow of a connected repository fetches and runs
// on GitHub. Each case runs the check as that workflow does, with `python3`
// in a temporary repository and a pull request's payload in
// `GITHUB_EVENT_PATH`.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { planRecords, setUpRecords } from "../src/daemon/records-place";
import { workItemSeal } from "../src/daemon/seal-state";
import { type Cleanups, commitSeal, guaranteeWith, proofs, roles, roundRecord, standing } from "./chain-run";
import { git, temporaryRepository } from "./repositories";

const PR_CHECK = join(__dirname, "..", "..", "..", "pr-check");
const CHAIN_CHECK = join(PR_CHECK, "skills", "code-review", "scripts", "chain_check.py");

/** The first line of a records root's `README.md`, which the check tells a root by. */
const MARKER = "# What AgenticSeal maintains in seal/";

/** Writes a file in a repository, with the folders above it. */
function write(repo: string, path: string, text: string): void {
  mkdirSync(dirname(join(repo, path)), { recursive: true });
  writeFileSync(join(repo, path), text);
}

/** Commits everything in the folder. A commit of a work item names it in the trailer the check reads. */
function commitAll(repo: string, subject: string, workItem?: string): void {
  git(repo, "add", "--all");
  git(repo, "commit", "--quiet", "-m", subject, ...(workItem === undefined ? [] : ["-m", `Seal-Routing: ${workItem}`]));
}

/** Commits a records root on the checked-out branch: the marked `README.md`, and a `config.json` that names both languages. */
function commitRoot(repo: string): void {
  write(repo, "seal/README.md", `${MARKER}\n\nOwlery keeps the work records of this repository here.\n`);
  write(repo, "seal/config.json", `${JSON.stringify({ "Commit and pull request language": "English", "Record language": "English", "Broad gate": "true" }, null, 2)}\n`);
  commitAll(repo, "chore: add the place for work records");
}

/** The `routing.md` of a work item that goes through the review chain on a branch. */
function routing(workItem: string, branch: string): string {
  return [
    `# Routing: ${workItem}`,
    "",
    "| Axis | Answer |",
    "|---|---|",
    "| Review | through the review chain |",
    "| Destination | open the pull request |",
    "| Planning | the session |",
    "| Implementation | the session |",
    "| Automation | yes |",
    `| Branch | ${branch} |`,
    "",
    "Answered 2026-11-22 by the session, before the first edit.",
    "",
  ].join("\n");
}

/** A `decisions.md` holding a reversed decision and an open question, each as a `seal` block. */
const DECISIONS = [
  "# Decisions and questions: 1-x",
  "",
  "```seal",
  "decision: 1 route",
  "decided: The work item runs through the review chain, with no framer.",
  "grounds: `docs/roadmap.md` *Milestones* row 2 puts every pull request of a work item under the check.",
  "by: orchestrator",
  "state: reversed",
  "reversal: Frame it first: the change reaches the protocol.",
  "```",
  "",
  "```seal",
  "question: 2",
  "asks: May the run push the branch to `origin`?",
  "grounds: No document of the repository grants it, and a session cannot grant itself a push.",
  "by: sealer",
  "option: `yes` The branch is pushed and the pull request opens.",
  "option: `no` The work item stays on this machine.",
  "default: `yes`",
  "state: open",
  "```",
  "",
].join("\n");

// Each run of the check starts Python and its git, which takes seconds while the rest of the suite runs beside it.
describe("the pull request check", { timeout: 30_000 }, () => {
  const cleanups: Cleanups = [];
  afterEach(async () => {
    for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
  });

  /** A temporary repository with one commit on `main`, removed when the case ends. */
  const repository = (): { base: string; repo: string } => {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    return made;
  };

  /**
   * Runs the check in the repository against `main`, as a pull request that is
   * ready or a draft. The environment is the few names the run needs and no
   * other, and `-B` keeps Python from writing its bytecode into `pr-check/`.
   * `sealing` runs it as the broad gate's step does, before the sealer has
   * written: what only the later stages write is then printed and not failed.
   * The payload's body is a line with no seal section, and with `body` false
   * the payload holds no body: the check reads neither.
   */
  const check = (made: { base: string; repo: string }, state: "ready" | "draft", sealing = false, body = true): { exit: number | null; output: string } => {
    const payload = join(made.base, `${state}.json`);
    writeFileSync(payload, JSON.stringify({ pull_request: { draft: state === "draft", ...(body ? { body: "hello" } : {}) } }));
    const run = spawnSync("python3", ["-B", CHAIN_CHECK, "--baseline", "main", ...(sealing ? ["--sealing"] : [])], {
      cwd: made.repo,
      encoding: "utf8",
      env: { PATH: process.env.PATH ?? "/usr/bin:/bin", HOME: made.base, GITHUB_EVENT_PATH: payload },
    });
    if (run.error) throw run.error;
    return { exit: run.status, output: `${run.stdout}${run.stderr}` };
  };

  /** A repository with the records root on `main`, and a branch `feature` whose `routing.md` declares a work item through the review chain, with no round record. */
  const declared = (): { base: string; repo: string } => {
    const made = repository();
    commitRoot(made.repo);
    git(made.repo, "checkout", "--quiet", "-b", "feature");
    write(made.repo, "seal/threads/1-x/routing.md", routing("1-x", "feature"));
    write(made.repo, "x", "x\n");
    commitAll(made.repo, "feat: x", "1-x");
    return made;
  };

  it("passes a ready pull request that declares no work item, and says that it examined nothing, in a repository with the records root and in one with none", () => {
    const examinedNothing = "this pull request declared neither way, so the review-chain check examined nothing";

    const withRoot = repository();
    commitRoot(withRoot.repo);
    git(withRoot.repo, "checkout", "--quiet", "-b", "outside");
    write(withRoot.repo, "x", "x\n");
    commitAll(withRoot.repo, "an outside contributor's change");
    const rooted = check(withRoot, "ready");
    expect(rooted.output).toContain(examinedNothing);
    expect(rooted.exit).toBe(0);

    const noRoot = repository();
    git(noRoot.repo, "checkout", "--quiet", "-b", "outside");
    write(noRoot.repo, "x", "x\n");
    commitAll(noRoot.repo, "an outside contributor's change");
    const rootless = check(noRoot, "ready");
    expect(rootless.output).toContain(examinedNothing);
    expect(rootless.exit).toBe(0);
  });

  it("fails a ready pull request whose branch declares a work item through the review chain and holds no round record, names its routing.md, and passes the same pull request as a draft", () => {
    const made = declared();
    const ready = check(made, "ready");
    expect(ready.output).toContain("seal/threads/1-x/routing.md:0  declares `through the review chain` and seal/threads/1-x/trail/rounds/ holds no `round-N.md`");
    expect(ready.exit).toBe(1);
    // The root names both languages, so no refusal is about the root's `config.json`.
    expect(ready.output).not.toContain("config.json");
    expect(check(made, "draft").exit).toBe(0);
  });

  it("reads the root a setup of the records place wrote: a branch that declares a work item with no round record fails as a ready pull request, and no refusal names a key of config.json", async () => {
    const made = repository();
    const plan = await planRecords(made.repo, "true", "1.2.3");
    await setUpRecords(made.repo, "true", "1.2.3", plan.stamp);
    expect(existsSync(join(made.repo, "seal", "config.json"))).toBe(true);
    git(made.repo, "checkout", "--quiet", "-b", "feature");
    write(made.repo, "seal/threads/1-x/routing.md", routing("1-x", "feature"));
    write(made.repo, "x", "x\n");
    commitAll(made.repo, "feat: x", "1-x");
    const ready = check(made, "ready");
    // The check tells the written root by its marker, so it judges the branch its `routing.md` names.
    expect(ready.output).toContain("seal/threads/1-x/routing.md:0  declares `through the review chain` and seal/threads/1-x/trail/rounds/ holds no `round-N.md`");
    expect(ready.exit).toBe(1);
    // The written `config.json` names both languages, so the check refuses nothing of it.
    expect(ready.output).not.toContain("config.json");
    expect(ready.output).not.toContain("language");
  });

  it("passes the records a sealed chain of two rounds and one fix pass left, as a ready pull request with no body: the gate's record, and the guarantee whose verdict block names the fix pass's session among the builders and another as the judge, in a commit that also carries the rows of the two calls the sealer was refused, and fails the same branch before round 2 for the verifying round it owes", async () => {
    // The first start stops after the fix pass: round 2's proofer answers with no record until the case lets it.
    let verifies = false;
    // The sealer asks to write a file and to run a command: its grant refuses both, and each is a row of `trail/refusals.md` in the commit that carries the guarantee.
    const asks = (_prompt: string, role?: { role: string }) => (role?.role === "sealer" ? [{ tool: "Write", action: "write" as const, path: "notes.md", text: "notes.md" }, { tool: "Bash", action: "run" as const, path: null, text: "pnpm -r run check" }] : []);
    const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: roles({ proofer: (given) => (given.round === 2 && !verifies ? "No record." : proofs(given)) }, { asks }) });
    const a = workItems[0]!;
    const worktree = { base: join(a.worktree, ".."), repo: a.worktree };
    expect(await c.getSeal(a.id, 1)).toBe("done");
    await c.chain(a.id, "stopped");
    const owed = check(worktree, "ready", true);
    expect(owed.output).toContain("a verifying round is owed");
    expect(owed.exit).toBe(1);

    verifies = true;
    expect(await c.getSeal(a.id, 2)).toBe("done");
    await c.chain(a.id, "rested");
    // The daemon's own records, read by the check's Python: the rounds, the run block and the verdict block with the daemon's lines.
    const sealed = check(worktree, "ready", false, false);
    expect(sealed.exit, sealed.output).toBe(0);
    for (const file of ["round-", "gate.md", "guarantee.md:"]) expect(sealed.output, file).not.toContain(file);
    expect(git(a.worktree, "show", "--name-only", "--format=%s", "HEAD").trim().split("\n")).toEqual(["chore: record the sealer's verdict", "", "seal/threads/1795388700-sealed-work/guarantee.md", "seal/threads/1795388700-sealed-work/trail/refusals.md"]);
    expect(readFileSync(join(a.worktree, "seal/threads/1795388700-sealed-work/trail/refusals.md"), "utf8")).toContain("| seal 2 | sealer | Write | writes a file | no-write |\n| seal 2 | sealer | Bash | runs a command | no-command |\n");
    expect(readFileSync(join(a.worktree, "seal/threads/1795388700-sealed-work/guarantee.md"), "utf8")).toMatch(/\nbuilt-by: the session, fake-\d+\njudged-by: fake-\d+\nmodel: fake\nrules: owlery 0\.0\.2\n```\n/u);
    // A body with no seal section is named as not read, and the same records pass with it.
    const ready = check(worktree, "ready");
    expect(ready.exit, ready.output).toBe(0);
    expect(ready.output).toContain("not read: the pull request's body, since it holds no `<!-- owlery:seal -->` line and no `<!-- /owlery:seal -->` line");
  });

  /**
   * The branch `declared` makes, after one round that left no finding: the
   * round's record, committed, and the gate's commit, which is the head that
   * record leaves. Nothing of the gate or the seal is written.
   */
  const reviewed = (): { base: string; repo: string; gate: string } => {
    const made = declared();
    const target = git(made.repo, "rev-parse", "HEAD").trim();
    write(made.repo, "seal/threads/1-x/trail/rounds/round-1.md", ["# Review round 1: 1-x", "", "```seal", `target: ${target} against main`, "```", "", "## Findings", "", "## Confirmations", ""].join("\n"));
    commitAll(made.repo, "chore: record review round 1", "1-x");
    return { ...made, gate: git(made.repo, "rev-parse", "HEAD").trim() };
  };

  /** Commits the gate's record as the daemon writes it: one run block that names the gate's commit against the base's commit. */
  const gated = (made: { repo: string; gate: string }): void => {
    write(made.repo, "seal/threads/1-x/trail/gate.md", ["# Broad gate: 1-x", "", "```seal", `run: ${made.gate} against ${git(made.repo, "rev-parse", "main").trim()}`, "```", ""].join("\n"));
    commitAll(made.repo, "chore: record the broad gate's run", "1-x");
  };

  /** One run's section of a guarantee: its heading, and a verdict block that targets the gate's commit and holds the lines given after its verdict. */
  const section = (run: number, gate: string, ...lines: string[]): string => [`## Run ${String(run)}`, "", "```seal", `target: ${gate} against main`, "Verdict: sealed", ...lines, "```", ""].join("\n");

  /** Commits a guarantee of the sections given, with whatever else the case wrote. */
  const guaranteed = (made: { repo: string }, ...sections: string[]): void => {
    write(made.repo, "seal/threads/1-x/guarantee.md", ["# Guarantee: 1-x", "", sections.join("\n")].join("\n"));
    commitAll(made.repo, "chore: record the sealer's verdict", "1-x");
  };

  const REFUSED_CALLS = ["# Refused calls: 1-x", "", "| Stage | Role | Tool | What the call does | Rule |", "|---|---|---|---|---|", "| seal 1 | sealer | Write | writes a file | no-write |", ""].join("\n");
  const DAEMONS_LINES = ["built-by: the session, s-1", "judged-by: s-2", "model: owl-large", "rules: owlery 0.0.2"];

  /** The branch `reviewed` makes, gated, and sealed by one verdict block with the daemon's lines; `block` is that block's lines between its fences. */
  const sealedBranch = (): { base: string; repo: string; gate: string; block: string[] } => {
    const made = reviewed();
    gated(made);
    guaranteed(made, section(1, made.gate, ...DAEMONS_LINES));
    return { ...made, block: [`target: ${made.gate} against main`, "Verdict: sealed", ...DAEMONS_LINES] };
  };

  /** A seal section written by hand in the form of the pull request work item's `frame/design.md` *Data & interfaces*: its two marker lines around a heading, a sentence and a `seal` block of the lines given. */
  const sealSection = (...block: string[]): string[] => [
    "<!-- owlery:seal -->",
    "## Owlery seal",
    "",
    "The newest verdict of `seal/threads/1-x/guarantee.md`. A seal binds the commit it names, and the check `Owlery seal` says whether it holds at this pull request's head commit:",
    "",
    "```seal",
    ...block,
    "```",
    "<!-- /owlery:seal -->",
  ];

  /** What the check sent a server: each request's method, path, two of its headers and its JSON body. */
  type Sent = { method: string; url: string; authorization: string; accept: string; body: { [key: string]: unknown; output: { title: string; summary: string } } };

  /** A server on the loopback address that notes each request and answers it with `status`, closed when the case ends. */
  const server = async (status = 201): Promise<{ url: string; sent: Sent[] }> => {
    const sent: Sent[] = [];
    const listening = createServer((request, response) => {
      let text = "";
      request.setEncoding("utf8");
      request.on("data", (chunk: string) => {
        text += chunk;
      });
      request.on("end", () => {
        sent.push({ method: request.method ?? "", url: request.url ?? "", authorization: request.headers.authorization ?? "", accept: request.headers.accept ?? "", body: JSON.parse(text) as Sent["body"] });
        response.writeHead(status, { "content-type": "application/json" });
        response.end(status < 300 ? '{"id": 1}' : '{"message": "Resource not accessible by integration"}');
      });
    });
    await new Promise<void>((resolve) => listening.listen(0, "127.0.0.1", resolve));
    cleanups.push(() => new Promise<void>((resolve) => listening.close(() => resolve())));
    return { url: `http://127.0.0.1:${String((listening.address() as AddressInfo).port)}`, sent };
  };

  /** The names a run of the workflow hands the check, with the API at `url`. */
  const posting = (url: string): Record<string, string> => ({ GITHUB_TOKEN: "t0ken", GITHUB_REPOSITORY: "owner/project", GITHUB_API_URL: url });

  /**
   * Runs the check as `check` does, without blocking the server a case
   * started. The payload holds `draft`, the head commit as `head.sha`, and
   * `body`, a line with no seal section where none is given and no body
   * where it is null.
   */
  const run = (made: { base: string; repo: string }, options: { draft?: boolean; body?: string | null; baseline?: string; args?: string[]; env?: Record<string, string> } = {}): Promise<{ exit: number | null; output: string }> => {
    const payload = join(made.base, "event.json");
    const head = git(made.repo, "rev-parse", "HEAD").trim();
    writeFileSync(payload, JSON.stringify({ pull_request: { draft: options.draft ?? false, head: { sha: head }, ...(options.body === null ? {} : { body: options.body ?? "hello" }) } }));
    return new Promise((resolve, reject) => {
      const child = spawn("python3", ["-B", CHAIN_CHECK, "--baseline", options.baseline ?? "main", ...(options.args ?? [])], {
        cwd: made.repo,
        env: { PATH: process.env.PATH ?? "/usr/bin:/bin", HOME: made.base, GITHUB_EVENT_PATH: payload, ...options.env },
      });
      let output = "";
      const take = (chunk: string): void => {
        output += chunk;
      };
      child.stdout.setEncoding("utf8").on("data", take);
      child.stderr.setEncoding("utf8").on("data", take);
      child.on("error", reject);
      child.on("close", (exit) => resolve({ exit, output }));
    });
  };

  // The sentence every refusal of the body arm ends with.
  const SECTION_IS = "the seal section, between `<!-- owlery:seal -->` and `<!-- /owlery:seal -->`, is the newest verdict block of the work item's `guarantee.md` at the head commit, which Owlery's daemon copies there line for line";

  it("passes a ready pull request whose body holds the seal section as the daemon writes it, alone and between a person's lines, with the lines ended as a browser ends them too, and names no line of the body", async () => {
    const made = sealedBranch();
    for (const lines of [sealSection(...made.block), ["A person's line above.", "", ...sealSection(...made.block), "", "A person's line below, with `<!-- a comment -->` in it."]]) {
      for (const end of ["\n", "\r\n"]) {
        const passed = await run(made, { body: lines.join(end) });
        expect(passed.exit, passed.output).toBe(0);
        expect(passed.output).not.toContain("the pull request's body");
      }
    }
    // A fence like a block's in the section is named, as in a record, and decides nothing.
    const near = sealSection(...made.block);
    near.splice(-1, 0, "```Seal", "x", "```");
    const named = await run(made, { body: near.join("\n") });
    expect(named.exit, named.output).toBe(0);
    expect(named.output).toContain("seal/threads/1-x:0  the pull request's body, line 14: not read: ````Seal` opens a fence like a `seal` block and is not one");
  });

  it("passes a ready pull request whose body is the one the daemon's pull request stage wrote for a sealed chain of two rounds and one fix pass, and names no line of it", async () => {
    const { c, workItems, gh } = await standing(cleanups, ["Sealed work"], { roleAdapter: roles() });
    const a = workItems[0]!;
    expect(await c.getSeal(a.id, 1)).toBe("done");
    await c.chain(a.id, "rested");
    const created = gh.calls().findIndex((call) => call[1] === "create");
    const body = gh.bodies()[created] ?? "";
    expect(body).toContain("\n<!-- /owlery:seal -->\n\n## Review rounds\n");
    const passed = await run({ base: join(a.worktree, ".."), repo: a.worktree }, { body });
    expect(passed.exit, passed.output).toBe(0);
    expect(passed.output).not.toContain("the pull request's body");
  });

  it("refuses a seal section that is not the newest verdict block of guarantee.md at the head commit, on the work item's directory and naming the body's line: another target, a verdict that is not sealed, a line the reader refuses, a second block and no block", async () => {
    const made = sealedBranch();
    const base = git(made.repo, "rev-parse", "main").trim();
    const refused = async (lines: string[], said: string): Promise<void> => {
      const answer = await run(made, { body: ["A person's line.", ...lines].join("\n") });
      expect(answer.output).toContain(`seal/threads/1-x:0  the pull request's body, ${said}; ${SECTION_IS}\n`);
      expect(answer.exit).toBe(1);
    };
    // The person's line is the body's first, so the section's marker is its second and the block's opener its seventh.
    await refused(sealSection(`target: ${base} against main`, ...made.block.slice(1)), `line 8: the section's verdict block holds \`target: ${base} against main\` where the newest verdict block of \`seal/threads/1-x/guarantee.md\` at the head commit holds \`target: ${made.gate} against main\``);
    await refused(sealSection(made.block[0] ?? "", "Verdict: withheld reason: x", ...made.block.slice(2)), "line 9: the section's verdict block holds `Verdict: withheld reason: x` where the newest verdict block of `seal/threads/1-x/guarantee.md` at the head commit holds `Verdict: sealed`");
    await refused(sealSection(...made.block.slice(0, 2), "colour: blue", ...made.block.slice(2)), "line 10: `colour: blue` is no field of a verdict block, which takes `target:`, `original:`, `Verdict:`, `built-by:`, `judged-by:`, `model:` and `rules:`, each written `<key>: <value>`");
    // A block whose daemon's lines are gone differs from the record's by their absence.
    await refused(sealSection(...made.block.slice(0, 2)), "line 7: the section's verdict block holds no `built-by:` line, no `judged-by:` line, no `model:` line and no `rules:` line where the newest verdict block of `seal/threads/1-x/guarantee.md` at the head commit holds `built-by: the session, s-1`, `judged-by: s-2`, `model: owl-large` and `rules: owlery 0.0.2`");
    const twice = sealSection(...made.block);
    twice.splice(-1, 0, "", "```seal", ...made.block, "```");
    await refused(twice, "line 16: the seal section holds a second verdict block");
    await refused(["<!-- owlery:seal -->", "## Owlery seal", "", "No block.", "<!-- /owlery:seal -->"], "line 2: the seal section holds no verdict block");

    // A branch with no guarantee: the section copies a record that is not there.
    const unsealed = reviewed();
    gated(unsealed);
    const none = await run(unsealed, { body: ["A person's line.", ...sealSection(...made.block)].join("\n") });
    expect(none.output).toContain(`seal/threads/1-x:0  the pull request's body, line 7: the section's verdict block copies none, since no judged work item's \`guarantee.md\` holds a verdict block that reads at the head commit; ${SECTION_IS}\n`);
    expect(none.exit).toBe(1);
  }, 60_000);

  it("names the body as not read and refuses nothing of it where it holds no seal section, where it holds two, where its closing marker does not follow its opening one, and where the payload holds no body", async () => {
    const made = sealedBranch();
    const unread = async (body: string | null, why: string): Promise<void> => {
      const answer = await run(made, { body });
      expect(answer.output).toContain(`not read: the pull request's body, since ${why}, so no seal section of it is compared with \`guarantee.md\`, whose newest verdict block Owlery's daemon copies there\n`);
      expect(answer.exit, answer.output).toBe(0);
    };
    await unread("hello", "it holds no `<!-- owlery:seal -->` line and no `<!-- /owlery:seal -->` line");
    await unread([...sealSection(...made.block), ...sealSection(...made.block)].join("\n"), "it holds 2 `<!-- owlery:seal -->` lines, and a body holds one seal section");
    await unread([...sealSection(...made.block)].reverse().join("\n"), "it holds no `<!-- /owlery:seal -->` line after a `<!-- owlery:seal -->` line");
    await unread(sealSection(...made.block).slice(0, -1).join("\n"), "it holds no `<!-- /owlery:seal -->` line after a `<!-- owlery:seal -->` line");
    await unread(null, "the event payload holds no `pull_request.body`");
    // A marker line is one of the two markers with spaces and tabs at its ends, and with no other character there: the daemon reads it so too.
    await unread([`\u0085<!-- owlery:seal -->`, "x", `\ufeff<!-- /owlery:seal -->`].join("\n"), "it holds no `<!-- owlery:seal -->` line and no `<!-- /owlery:seal -->` line");
    const spaced = sealSection(...made.block);
    spaced[0] = ` \t${spaced[0] ?? ""}\t `;
    spaced[spaced.length - 1] = `\t${spaced.at(-1) ?? ""}  `;
    for (const end of ["\u0085", "\u001c", "\ufeff"]) {
      const read = await run(made, { body: [...spaced, "", "## What changed", "", `${end}<!-- /owlery:seal -->`, `<!-- owlery:seal -->${end}`].join("\n") });
      expect(read.exit, read.output).toBe(0);
      expect(read.output, JSON.stringify(end)).not.toContain("the pull request's body");
    }

    // A declaration that does not read judges no work item, so the section has no record to be compared with.
    write(made.repo, "seal/threads/1-x/routing.md", "# Routing: 1-x\n\nNo table.\n");
    commitAll(made.repo, "chore: break the declaration", "1-x");
    const unjudged = await run(made, { body: sealSection(...made.block).join("\n") });
    expect(unjudged.output).toContain("not read: the pull request's body, since no declaration of this pull request reads, so no seal section of it is compared with `guarantee.md`");
    expect(unjudged.output).not.toContain("the pull request's body, line");
  });

  it("posts its verdict with --post as the check `Owlery seal` on the payload's head commit, one request a run: success titled with the sealed commit, failure where the head has no seal or other records are refused, neutral for a draft that would be refused, success for a pull request that declares no work item, and failure where the check could not run; the job's exit stays the check's", async () => {
    const { url, sent } = await server();
    const env = posting(url);
    const last = (): Sent["body"] | undefined => sent.at(-1)?.body;

    const made = sealedBranch();
    const head = git(made.repo, "rev-parse", "HEAD").trim();
    const sealed = await run(made, { body: null, args: ["--post"], env });
    expect(sealed.exit, sealed.output).toBe(0);
    expect(sent.map((request) => [request.method, request.url, request.authorization, request.accept])).toEqual([["POST", "/repos/owner/project/check-runs", "Bearer t0ken", "application/vnd.github+json"]]);
    expect(last()).toMatchObject({ name: "Owlery seal", head_sha: head, status: "completed", conclusion: "success", output: { title: `Sealed at ${made.gate.slice(0, 7)}` } });
    expect(last()?.output.summary).toContain(["```seal", ...made.block, "```"].join("\n"));
    expect(sealed.output).toContain(`chain-check: posted \`Owlery seal\`, success: Sealed at ${made.gate.slice(0, 7)}\n`);

    // The seal stands, and the body's section names another commit: the body arm alone refuses.
    const base = git(made.repo, "rev-parse", "main").trim();
    const other = await run(made, { body: sealSection(`target: ${base} against main`, ...made.block.slice(1)).join("\n"), args: ["--post"], env });
    expect(other.exit).toBe(1);
    expect(last()).toMatchObject({ head_sha: head, conclusion: "failure", output: { title: "The records are refused" } });
    expect(last()?.output.summary).toContain(`- seal/threads/1-x:0  the pull request's body, line 7: the section's verdict block holds \`target: ${base} against main\``);

    const unsealed = reviewed();
    gated(unsealed);
    const none = await run(unsealed, { args: ["--post"], env });
    expect(none.exit).toBe(1);
    expect(last()).toMatchObject({ head_sha: git(unsealed.repo, "rev-parse", "HEAD").trim(), conclusion: "failure", output: { title: "No seal at the head commit" } });
    expect(last()?.output.summary).toContain("- seal/threads/1-x/guarantee.md:0  git carries no guarantee file");

    const draft = await run(unsealed, { draft: true, args: ["--post"], env });
    expect(draft.exit).toBe(0);
    expect(last()).toMatchObject({ conclusion: "neutral", output: { title: "Draft: judged when it is ready" } });
    expect(last()?.output.summary).toContain("- seal/threads/1-x/guarantee.md:0  git carries no guarantee file");

    const outside = repository();
    commitRoot(outside.repo);
    git(outside.repo, "checkout", "--quiet", "-b", "outside");
    write(outside.repo, "x", "x\n");
    commitAll(outside.repo, "an outside contributor's change");
    const undeclared = await run(outside, { args: ["--post"], env });
    expect(undeclared.exit).toBe(0);
    expect(last()).toMatchObject({ conclusion: "success", output: { title: "Not judged: no work item is declared" } });

    const broken = await run(made, { baseline: "no-such-branch", args: ["--post"], env });
    expect(broken.exit).toBe(2);
    expect(last()).toMatchObject({ head_sha: head, conclusion: "failure", output: { title: "The seal check could not run" } });
    expect(sent).toHaveLength(6);
  }, 60_000);

  it("keeps its exit code where GitHub refuses the post and prints one notice with GitHub's status, and sends nothing without --post, without GITHUB_TOKEN, under --worktree or under --sealing", async () => {
    const refusing = await server(403);
    const made = sealedBranch();
    const unsealed = reviewed();
    for (const [branch, exit] of [[made, 0], [unsealed, 1]] as const) {
      const answer = await run(branch, { body: null, args: ["--post"], env: posting(refusing.url) });
      expect(answer.exit, answer.output).toBe(exit);
      expect(answer.output.split("`Owlery seal` was not posted: GitHub answered 403")).toHaveLength(2);
    }
    expect(refusing.sent).toHaveLength(2);

    const quiet = await server();
    const { GITHUB_TOKEN: _token, ...tokenless } = posting(quiet.url);
    expect((await run(made, { body: null, env: posting(quiet.url) })).exit).toBe(0);
    const noToken = await run(made, { body: null, args: ["--post"], env: tokenless });
    expect(noToken.exit).toBe(0);
    expect(noToken.output).toContain("`Owlery seal` was not posted: the environment holds no `GITHUB_TOKEN`");
    // The working tree is not what CI posts on, and the broad gate's own run comes before the guarantee.
    for (const [flag, why] of [["--worktree", "--worktree reads the working tree, and CI posts the check from HEAD"], ["--sealing", "--sealing runs before the sealer writes `guarantee.md`"]] as const) {
      expect((await run(made, { body: null, args: ["--post", flag], env: posting(quiet.url) })).output).toContain(`\`Owlery seal\` was not posted: ${why}\n`);
    }
    expect(quiet.sent).toEqual([]);
  }, 60_000);

  it("posts a ready pull request whose seal a later commit broke as a failure titled with the broken seal and its sealed commit, also where the commit after the seal was taken back and the guarantee arm refuses nothing, posts the same head as a draft as neutral, keeps the title of no seal for a head with no guarantee and for one whose newest verdict is withheld, which no later commit breaks, and titles as broken a seal whose commit HEAD does not descend from or the repository cannot resolve", async () => {
    const { url, sent } = await server();
    const env = posting(url);
    const last = (): Sent["body"] | undefined => sent.at(-1)?.body;
    const BROKEN = (gate: string): string => `Seal broken: a commit landed after ${gate.slice(0, 7)}`;

    const changed = sealedBranch();
    write(changed.repo, "x", "x, changed\n");
    commitAll(changed.repo, "fix: x", "1-x");
    const broken = await run(changed, { body: null, args: ["--post"], env });
    expect(broken.exit, broken.output).toBe(1);
    expect(last()).toMatchObject({ head_sha: git(changed.repo, "rev-parse", "HEAD").trim(), conclusion: "failure", output: { title: BROKEN(changed.gate) } });
    expect(last()?.output.summary).toContain(`- seal/threads/1-x/guarantee.md:0  the seal is broken: \`x\` changed after the sealed commit \`${changed.gate.slice(0, 7)}\``);
    expect(broken.output).toContain(`chain-check: posted \`Owlery seal\`, failure: ${BROKEN(changed.gate)}\n`);

    // The tree at the head is the sealed tree, and the rounds arm and the gate arm read the two commits after the seal.
    const back = sealedBranch();
    write(back.repo, "x", "x, changed\n");
    commitAll(back.repo, "fix: x", "1-x");
    write(back.repo, "x", "x\n");
    commitAll(back.repo, "revert: x", "1-x");
    const taken = await run(back, { body: null, args: ["--post"], env });
    expect(taken.exit, taken.output).toBe(1);
    expect(last()).toMatchObject({ conclusion: "failure", output: { title: BROKEN(back.gate) } });
    expect(last()?.output.summary).not.toContain("guarantee.md:");
    expect(last()?.output.summary).toContain("- seal/threads/1-x/trail/rounds/round-1.md:0  the last round's `target:` is behind HEAD");

    const draft = await run(changed, { draft: true, body: null, args: ["--post"], env });
    expect(draft.exit).toBe(0);
    expect(last()).toMatchObject({ conclusion: "neutral", output: { title: "Draft: judged when it is ready" } });

    const unsealed = reviewed();
    gated(unsealed);
    expect((await run(unsealed, { body: null, args: ["--post"], env })).exit).toBe(1);
    expect(last()).toMatchObject({ conclusion: "failure", output: { title: "No seal at the head commit" } });
    // A withheld verdict is no seal, so a commit after it breaks none.
    const withheld = reviewed();
    gated(withheld);
    guaranteed(withheld, section(1, withheld.gate, ...DAEMONS_LINES).replace("Verdict: sealed", "Verdict: withheld reason: x"));
    write(withheld.repo, "x", "x, changed\n");
    commitAll(withheld.repo, "fix: x", "1-x");
    expect((await run(withheld, { body: null, args: ["--post"], env })).exit).toBe(1);
    expect(last()).toMatchObject({ conclusion: "failure", output: { title: "No seal at the head commit" } });
    expect(last()?.output.summary).toContain(`- seal/threads/1-x/guarantee.md:0  the guarantee is behind HEAD: \`x\` changed after the commit it names, \`${withheld.gate.slice(0, 7)}\`, outside the closing records\n`);
    expect(last()?.output.summary).not.toContain("the seal is broken");

    // A seal whose commit HEAD does not descend from, and one whose commit the repository does not hold, are broken, as the daemon reads them.
    const off = reviewed();
    gated(off);
    git(off.repo, "checkout", "--quiet", "-b", "aside", "main");
    write(off.repo, "aside.txt", "Aside\n");
    commitAll(off.repo, "feat: aside");
    const aside = git(off.repo, "rev-parse", "HEAD").trim();
    git(off.repo, "checkout", "--quiet", "feature");
    guaranteed(off, section(1, aside, ...DAEMONS_LINES));
    expect((await run(off, { body: null, args: ["--post"], env })).exit).toBe(1);
    expect(last()).toMatchObject({ conclusion: "failure", output: { title: BROKEN(aside) } });
    expect(last()?.output.summary).toContain(`- seal/threads/1-x/guarantee.md:0  the seal is broken: HEAD does not descend from the sealed commit \`${aside.slice(0, 7)}\`; a new seal is owed at HEAD`);
    const nowhere = reviewed();
    gated(nowhere);
    guaranteed(nowhere, section(1, "d".repeat(40), ...DAEMONS_LINES));
    expect((await run(nowhere, { body: null, args: ["--post"], env })).exit).toBe(1);
    expect(last()).toMatchObject({ conclusion: "failure", output: { title: BROKEN("d".repeat(40)) } });
    expect(last()?.output.summary).toContain(`- seal/threads/1-x/guarantee.md:0  the seal is broken: this repository cannot resolve the sealed commit \`${"d".repeat(40)}\`; a new seal is owed at HEAD`);
    expect(sent).toHaveLength(7);
  }, 60_000);

  it("passes the gate's record and the seal as the daemon writes them: a run block that names the head, then a verdict block with the lines on who built and who judged that targets the same commit, in a commit that also carries trail/refusals.md, and fails where that commit carries another file of the work item", () => {
    const made = reviewed();
    gated(made);
    write(made.repo, "seal/threads/1-x/trail/refusals.md", REFUSED_CALLS);
    guaranteed(made, section(1, made.gate, ...DAEMONS_LINES));
    const sealed = check(made, "ready", false, false);
    expect(sealed.exit, sealed.output).toBe(0);
    expect(sealed.output).not.toContain("guarantee.md:");

    // Only the closing records follow the sealed commit: a decision committed after it breaks the seal.
    write(made.repo, "seal/threads/1-x/decisions.md", DECISIONS);
    commitAll(made.repo, "chore: record a decision and a question", "1-x");
    const behind = check(made, "ready", false, false);
    expect(behind.output).toContain(`seal/threads/1-x/guarantee.md:0  the seal is broken: \`seal/threads/1-x/decisions.md\` changed after the sealed commit \`${made.gate.slice(0, 7)}\`, outside the closing records; a new seal is owed at HEAD\n`);
    expect(behind.exit).toBe(1);
  });

  /**
   * The branch `sealedBranch` makes, after which `main` gains a commit and
   * the branch merges it: a commit of `other.txt`, or with `edit` an empty
   * commit, whose merge commit itself changes `x`.
   */
  const mergedAfterSeal = (edit: boolean): ReturnType<typeof sealedBranch> => {
    const made = sealedBranch();
    git(made.repo, "checkout", "--quiet", "main");
    if (edit) git(made.repo, "commit", "--quiet", "--allow-empty", "-m", "chore: nothing changed");
    else {
      write(made.repo, "other.txt", "Another file\n");
      commitAll(made.repo, "feat: another file");
    }
    git(made.repo, "checkout", "--quiet", "feature");
    git(made.repo, "merge", "--quiet", "--no-ff", "--no-commit", "main");
    if (edit) {
      write(made.repo, "x", "x, edited in the merge\n");
      git(made.repo, "add", "x");
    }
    git(made.repo, "commit", "--quiet", "--no-edit");
    expect(git(made.repo, "rev-list", "--parents", "-n", "1", "HEAD").trim().split(" ")).toHaveLength(3);
    return made;
  };

  /**
   * Has `main` gain what leaves the sealed tree as it was once the branch
   * `feature` merges it, and merges it: `x` as the branch committed it before
   * the seal, or a commit of `other.txt` and its revert. Each is a merge of
   * the base after the seal whose commits the daemon's rounds read.
   */
  const mergeAsSealed = (repo: string, how: "same file" | "revert"): void => {
    git(repo, "checkout", "--quiet", "main");
    if (how === "same file") {
      write(repo, "x", "x\n");
      commitAll(repo, "feat: x on the base");
    } else {
      write(repo, "other.txt", "Another file\n");
      commitAll(repo, "feat: another file");
      git(repo, "rm", "--quiet", "other.txt");
      git(repo, "commit", "--quiet", "-m", "revert: another file");
    }
    git(repo, "checkout", "--quiet", "feature");
    git(repo, "merge", "--quiet", "--no-ff", "--no-edit", "main");
  };

  /** The guarantee arm's line for a commit of the base, touching `path`, that a merge brought after the seal of `gate`. */
  const BROUGHT = (path: string, gate: string): string => `seal/threads/1-x/guarantee.md:0  the seal is broken: a commit of the base that a merge brought after the sealed commit \`${gate.slice(0, 7)}\` touches \`${path}\`, outside the work item's records; a new seal is owed at HEAD\n`;

  it("fails a merge of the base after the seal, though the merge commit and the base's commit are read by no walk of the branch's commits: the guarantee arm compares the sealed commit's tree with HEAD's, says that the seal is broken, and names the path that changed and the sealed commit", () => {
    const made = mergedAfterSeal(false);
    const merged = check(made, "ready", false, false);
    expect(merged.output).toContain(`seal/threads/1-x/guarantee.md:0  the seal is broken: \`other.txt\` changed after the sealed commit \`${made.gate.slice(0, 7)}\`, outside the closing records; a new seal is owed at HEAD\n`);
    // The rounds arm and the gate arm walk the branch's own commits, and a merge brings none.
    expect(merged.output).not.toContain("round-1.md:0");
    expect(merged.output).not.toContain("gate.md:0");
    expect(merged.exit).toBe(1);
  });

  it("fails a merge commit after the seal that itself changes a source file, where the base's commit it merges changes nothing", () => {
    const made = mergedAfterSeal(true);
    expect(git(made.repo, "diff", "--name-only", made.gate, "HEAD").trim().split("\n")).toEqual(["seal/threads/1-x/guarantee.md", "seal/threads/1-x/trail/gate.md", "x"]);
    const edited = check(made, "ready", false, false);
    expect(edited.output).toContain(`seal/threads/1-x/guarantee.md:0  the seal is broken: \`x\` changed after the sealed commit \`${made.gate.slice(0, 7)}\`, outside the closing records; a new seal is owed at HEAD\n`);
    expect(edited.exit).toBe(1);
  });

  it("fails a merge of the base after the seal whose change the sealed tree already holds, a file the branch committed before the seal or a commit and its revert: the two trees hold the same, so the guarantee arm names the path a commit of the base touched, under the title of a broken seal", async () => {
    const { url, sent } = await server();
    for (const [how, path] of [["same file", "x"], ["revert", "other.txt"]] as const) {
      const made = sealedBranch();
      mergeAsSealed(made.repo, how);
      expect(git(made.repo, "diff", "--name-only", made.gate, "HEAD").trim().split("\n"), how).toEqual(["seal/threads/1-x/guarantee.md", "seal/threads/1-x/trail/gate.md"]);
      const merged = await run(made, { body: null, args: ["--post"], env: posting(url) });
      expect(merged.output, how).toContain(BROUGHT(path, made.gate));
      // The rounds arm and the gate arm walk the branch's own commits, and a merge brings none.
      expect(merged.output, how).not.toContain("round-1.md:0");
      expect(merged.output, how).not.toContain("gate.md:0");
      expect(merged.exit, how).toBe(1);
      expect(sent.at(-1)?.body, how).toMatchObject({ conclusion: "failure", output: { title: `Seal broken: a commit landed after ${made.gate.slice(0, 7)}` } });
    }
  }, 60_000);

  it("gives the daemon's answer for each history of a work item's head: it passes where the daemon reads the seal as sealed, and fails where the daemon reads it as broken or reads none", async () => {
    /** A branch `feature` of a repository whose `main` holds the records root: one commit of `x`, then the records of a chain that sealed it, as the daemon writes and commits them. */
    const history = (given: { seal?: boolean; verdict?: string; target?: string } = {}) => {
      const made = repository();
      commitRoot(made.repo);
      const base = git(made.repo, "rev-parse", "HEAD").trim();
      git(made.repo, "checkout", "--quiet", "-b", "feature");
      write(made.repo, "x", "x\n");
      commitAll(made.repo, "feat: x");
      const gate = commitSeal(made.repo, { workItem: "1-x", branch: "feature", base, ...given });
      return { ...made, gate, item: { worktree: made.repo, branch: "feature", baseBranch: "main", baseCommit: base } };
    };
    const GUARANTEE_AT = "seal/threads/1-x/guarantee.md";
    const merge = (repo: string, edit: boolean): void => {
      git(repo, "checkout", "--quiet", "main");
      if (edit) git(repo, "commit", "--quiet", "--allow-empty", "-m", "chore: nothing changed");
      else {
        write(repo, "other.txt", "Another file\n");
        commitAll(repo, "feat: another file");
      }
      git(repo, "checkout", "--quiet", "feature");
      git(repo, "merge", "--quiet", "--no-ff", "--no-commit", "main");
      if (edit) write(repo, "x", "x, edited in the merge\n");
      commitAll(repo, "Merge branch 'main' into feature");
    };
    const histories: [string, (made: ReturnType<typeof history>) => void, "sealed" | "broken" | null, { seal?: boolean; verdict?: string; target?: string }?, ((made: ReturnType<typeof history>) => string)?][] = [
      ["the sealed head", () => undefined, "sealed"],
      ["a commit that changes the guarantee below its block", ({ repo }) => {
        write(repo, GUARANTEE_AT, `${git(repo, "show", `HEAD:${GUARANTEE_AT}`)}\nThe sealer's notes end here.\n`);
        commitAll(repo, "docs: note below the verdict");
      }, "sealed"],
      ["a commit of the refused calls", ({ repo }) => {
        write(repo, "seal/threads/1-x/trail/refusals.md", REFUSED_CALLS);
        commitAll(repo, "chore: record the refusals");
      }, "sealed"],
      ["a commit that changes a source file", ({ repo }) => {
        write(repo, "x", "x, changed\n");
        commitAll(repo, "fix: x");
      }, "broken"],
      ["a commit that changes decisions.md", ({ repo }) => {
        write(repo, "seal/threads/1-x/decisions.md", "# Decisions and questions: 1-x\n");
        commitAll(repo, "chore: record a decision");
      }, "broken"],
      ["a commit that adds a round record", ({ repo }) => {
        const at = git(repo, "rev-parse", "HEAD").trim();
        write(repo, "seal/threads/1-x/trail/rounds/round-2.md", roundRecord("# Review round 2: 1-x", `${at}, fixes ${at}..${at}`));
        commitAll(repo, "chore: record review round 2");
      }, "broken"],
      ["a merge of a base that gained a commit", ({ repo }) => merge(repo, false), "broken"],
      ["a merge commit that itself changes a source file", ({ repo }) => merge(repo, true), "broken"],
      ["a merge of a base that committed the file the branch committed before the seal", ({ repo }) => mergeAsSealed(repo, "same file"), "broken", undefined, ({ gate }) => BROUGHT("x", gate)],
      ["a merge of a base that gained a commit and its revert", ({ repo }) => mergeAsSealed(repo, "revert"), "broken", undefined, ({ gate }) => BROUGHT("other.txt", gate)],
      ["two commits of which the second takes the first back", ({ repo }) => {
        write(repo, "x", "x, changed\n");
        commitAll(repo, "fix: x");
        write(repo, "x", "x\n");
        commitAll(repo, "revert: x");
      }, "broken"],
      ["a head with no guarantee", () => undefined, null, { seal: false }],
      ["a newest verdict block that reads withheld", () => undefined, null, { verdict: "withheld reason: x" }],
      ["a newest verdict block that reads undecided", () => undefined, null, { verdict: "undecided question: May it?" }],
      ["a seal followed by a withheld verdict", ({ repo, gate }) => {
        write(repo, GUARANTEE_AT, guaranteeWith(git(repo, "show", `HEAD:${GUARANTEE_AT}`), "1-x", 2, `${gate} against main`, "withheld reason: x"));
        commitAll(repo, "chore: record the sealer's verdict");
      }, null],
      ["a guarantee with a line the reader refuses", ({ repo }) => {
        write(repo, GUARANTEE_AT, git(repo, "show", `HEAD:${GUARANTEE_AT}`).replace("Verdict: sealed\n", "Verdict: sealed\ngate: passed\n"));
        commitAll(repo, "chore: write a line the reader refuses");
      }, null],
      ["a branch reset to the commit before the guarantee", ({ repo }) => git(repo, "reset", "--quiet", "--hard", "HEAD~1"), null],
      ["a seal of a commit the head does not hold", ({ repo }) => {
        git(repo, "checkout", "--quiet", "-b", "aside", "main");
        write(repo, "aside.txt", "Aside\n");
        commitAll(repo, "feat: aside");
        const aside = git(repo, "rev-parse", "HEAD").trim();
        git(repo, "checkout", "--quiet", "feature");
        write(repo, GUARANTEE_AT, guaranteeWith(null, "1-x", 1, `${aside} against main`));
        commitAll(repo, "chore: record the sealer's verdict");
      }, "broken", { seal: false }],
      ["a seal of no commit of the repository", () => undefined, "broken", { target: "d".repeat(40) }],
    ];
    const answers = [];
    for (const [name, make, state, given, says] of histories) {
      const made = history(given);
      make(made);
      const seal = await workItemSeal(made.item, git(made.repo, "rev-parse", "HEAD").trim());
      const checked = check(made, "ready", false, false);
      answers.push([name, seal?.state ?? null, checked.exit]);
      if (says) expect(checked.output, name).toContain(says(made));
    }
    expect(answers).toEqual(histories.map(([name, , state]) => [name, state, state === "sealed" ? 0 : 1]));
  }, 120_000);

  it("refuses a verdict block whose judge is one of its builders, at the judged-by line, and reads the newest block alone: a judge that built none of the work passes, and so does a block that names no builder", () => {
    const made = reviewed();
    gated(made);
    guaranteed(made, section(1, made.gate, "built-by: the session, s-1", "judged-by: s-1", "model: owl-large", "rules: owlery 0.0.2"));
    const same = check(made, "ready", false, false);
    // The file's heading, a blank line, the run's heading and a blank line stand above the block, whose fourth line names the judge.
    expect(same.output).toContain(
      "seal/threads/1-x/guarantee.md:9  `judged-by: s-1` names a session that the block's `built-by:` line names too: the session that judges a work item built none of it, so this verdict block is no seal",
    );
    expect(same.exit).toBe(1);

    // The judge is found wherever the line names it, before `the session` too.
    guaranteed(made, section(1, made.gate, "built-by: s-1, the session", "judged-by: s-1"));
    const first = check(made, "ready", false, false);
    expect(first.output).toContain("seal/threads/1-x/guarantee.md:9  `judged-by: s-1` names a session");
    expect(first.exit).toBe(1);

    // A second run by another session: the first block still stands above it, and only the newest is read for its judge.
    guaranteed(made, section(1, made.gate, "built-by: the session, s-1", "judged-by: s-1", "model: owl-large", "rules: owlery 0.0.2"), section(2, made.gate, "built-by: the session, s-1", "judged-by: s-2", "model: owl-large", "rules: owlery 0.0.2"));
    const other = check(made, "ready", false, false);
    expect(other.output).not.toContain("judged-by");
    expect(other.exit, other.output).toBe(0);

    // A block written before the daemon wrote its lines names no builder and no judge, and one that names a judge alone has nothing to compare.
    guaranteed(made, section(1, made.gate), section(2, made.gate, "judged-by: s-1"));
    expect(check(made, "ready", false, false).exit).toBe(0);
    // `the session` is a builder's name and no id: a judge's id that is a part of a builder's is another session.
    guaranteed(made, section(1, made.gate, "built-by: the session, s-10", "judged-by: s-1"));
    expect(check(made, "ready", false, false).exit).toBe(0);
  });

  it("says of a verdict that is not sealed what Owlery does next, at the verdict's line: the person fixes what a withheld reason names and starts \"Get a seal\" again, an undecided question is decided by the orchestrator agent or answered in Owlery, and the gate and the sealer's stage then append their blocks", () => {
    const next =
      ": a ready pull request needs `sealed`. Where the reason of a `withheld` verdict names something to fix, fix it and start \"Get a seal\" again in Owlery. The question of an `undecided` verdict is decided by Owlery's orchestrator agent, or answered in Owlery where it parked the work item. Owlery's daemon then runs the broad gate and the sealer's stage on the new head, and each appends its block";
    const made = reviewed();
    gated(made);
    guaranteed(made, section(1, made.gate, ...DAEMONS_LINES).replace("Verdict: sealed", "Verdict: withheld reason: the changelog names `gone.ts`, which the tree does not hold"));
    const withheld = check(made, "ready", false, false);
    expect(withheld.output).toContain(`seal/threads/1-x/guarantee.md:7  the sealer's verdict reads \`Verdict: withheld reason: the changelog names \`gone.ts\`, which the tree does not hold\`${next}\n`);
    expect(withheld.exit).toBe(1);

    guaranteed(made, section(1, made.gate, ...DAEMONS_LINES).replace("Verdict: sealed", "Verdict: undecided question: does item 4 cover a renamed branch?"));
    const undecided = check(made, "ready", false, false);
    expect(undecided.output).toContain(`seal/threads/1-x/guarantee.md:7  the sealer's verdict reads \`Verdict: undecided question: does item 4 cover a renamed branch?\`${next}\n`);
    expect(undecided.exit).toBe(1);
    for (const said of [withheld.output, undecided.output]) for (const word of ["below the newest block", "seal gate", "templates/", "new HEAD"]) expect(said, word).not.toContain(word);
  });

  it("says of a missing gate record, of one with no run, of a missing guarantee and of one with no verdict what Owlery's daemon writes, and names no command and no template of AgenticSeal", () => {
    const made = reviewed();
    const none = check(made, "ready", false, false);
    expect(none.exit).toBe(1);
    expect(none.output).toContain(
      "seal/threads/1-x/trail/gate.md:0  git carries no gate record: once the review rounds settle, Owlery's daemon runs the repository's broad gate on the branch's head and commits this record where the run passes",
    );
    expect(none.output).toContain("seal/threads/1-x/guarantee.md:0  git carries no guarantee file: the sealer's stage of Owlery's daemon writes it once the broad gate has passed on the branch's head");

    write(made.repo, "seal/threads/1-x/trail/gate.md", "# Broad gate: 1-x\n\nThe run passed.\n");
    write(made.repo, "seal/threads/1-x/guarantee.md", "# Guarantee: 1-x\n\nVerdict: sealed\n");
    commitAll(made.repo, "chore: write both records with no block", "1-x");
    const empty = check(made, "ready", false, false);
    expect(empty.exit).toBe(1);
    expect(empty.output).toContain(
      "seal/threads/1-x/trail/gate.md:0  no run block: a passed run of the broad gate stands in a `seal` block holding `run: <tree> against <base commit>`, which Owlery's daemon appends below the text already there",
    );
    expect(empty.output).toContain(
      "seal/threads/1-x/guarantee.md:0  no verdict block: the sealer's verdict stands in a `seal` block holding `target: <sha> against <base>`, the `original:` line where one is owed and `Verdict:`, which the sealer's stage of Owlery's daemon appends below the text already there once the broad gate has passed on the branch's head",
    );
    for (const said of [none.output, empty.output]) for (const word of ["seal gate", "orchestrator", "templates/", "#1198"]) expect(said, word).not.toContain(word);
  });

  it("does not read decisions.md: a reversed decision and an open question in the work item's directory change neither its exit nor its output", () => {
    const made = declared();
    const before = check(made, "ready");
    expect(before.exit).toBe(1);
    write(made.repo, "seal/threads/1-x/decisions.md", DECISIONS);
    commitAll(made.repo, "chore: record a decision and a question", "1-x");
    const after = check(made, "ready");
    expect(after.output).not.toContain("decisions.md");
    expect(after).toEqual(before);
  });
});

describe("the pr-check folder", () => {
  const read = (path: string): string => readFileSync(join(PR_CHECK, path), "utf8");

  it("holds every script chain_check.py loads, each at the path the check reaches it by, and not the body's composer or the two readers only it loaded", () => {
    const scripts = [
      ...["sibling", "lines", "blocks", "fields", "gitcmd", "optin", "console", "config", "gate", "routing", "tables", "items"].map((name) => `lib/${name}.py`),
      "skills/code-review/scripts/chain_check.py",
      "skills/settle/scripts/rule_changes.py",
      "skills/settle/scripts/passages.py",
      ".github/scripts/rules.py",
    ];
    expect(scripts.filter((script) => !existsSync(join(PR_CHECK, script)))).toEqual([]);
    const gone = ["skills/code-review/scripts/pr_body.py", ".github/scripts/close_issues_on_release.py", "lib/gaps.py"];
    expect(gone.filter((script) => existsSync(join(PR_CHECK, script)))).toEqual([]);
    // The marker the cases above write is the one the taken check tells a records root by.
    expect(read("lib/optin.py")).toContain(`\nMARKER = ${JSON.stringify(MARKER)}\n`);
  });

  it("keeps AgenticSeal's licence text beside the scripts, and its notice names where they started, the release and the licence", () => {
    const licence = read("LICENSE");
    expect(licence.startsWith("MIT License\n")).toBe(true);
    expect(licence).toContain("\nCopyright (c) 2026 AgenticSeal contributors\n");
    expect(licence).toContain("The above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.");
    const notice = read("README.md");
    for (const named of ["AgenticSeal", "https://github.com/MichaelYcJo/AgenticSeal", "0.38.4", "MIT License", "`LICENSE`"]) expect(notice, named).toContain(named);
  });
});
