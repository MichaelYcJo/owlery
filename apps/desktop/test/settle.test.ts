// The release's settle: what it reads of every work item's `decisions.md`,
// which directories it keeps and why, and the list of the release's decisions
// made without asking. The cases read temporary repositories and never
// Owlery's own.
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { MARKER } from "../src/daemon/records-place";
import { command, listMarkdown, readSettle } from "../src/daemon/settle";
import { git, temporaryRepository } from "./repositories";

const SCRIPT = join(__dirname, "..", "scripts", "settle.mjs");

const F = "```";
/** A record of those blocks, each an `iadd` block of its lines, after a head of two lines. */
const record = (...blocks: string[][]): string => ["# Decisions and questions", "", ...blocks.flatMap((lines) => [`${F}iadd`, ...lines, F, ""])].join("\n");

const REVERSED = [
  "decision: 1 route",
  "decided: The work item runs through the review chain, with no framer.",
  "grounds: The change reaches no protocol.",
  "by: orchestrator",
  "state: reversed",
  "reversal: Frame it first: the change reaches the protocol.",
];
const OPEN = ["question: 2", "asks: May the run push the branch to `origin`?", "grounds: No document grants it.", "state: open"];

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
});

/** A temporary repository holding a records root, committed. */
function repository(): string {
  const made = temporaryRepository();
  cleanups.push(made.remove);
  write(made.repo, "agentory/README.md", `${MARKER}\n`);
  commit(made.repo, "chore: add the records root");
  return made.repo;
}

function write(repo: string, path: string, text: string): void {
  mkdirSync(dirname(join(repo, path)), { recursive: true });
  writeFileSync(join(repo, path), text);
}

function commit(repo: string, subject: string): void {
  git(repo, "add", "--all");
  git(repo, "commit", "--quiet", "-m", subject);
}

/** The command's exit and what it printed to each stream. */
function run(repo: string, ...args: string[]): { code: number; out: string; err: string } {
  let out = "";
  let err = "";
  const code = command(args, repo, { out: (text) => (out += text), err: (text) => (err += text) });
  return { code, out, err };
}

describe("the directories a settle keeps", () => {
  it("keeps a directory whose record holds a reversed decision, and names the decision's id, its line and the reversal's message, in a record whose lines end with a carriage return too", () => {
    const repo = repository();
    for (const end of ["\n", "\r\n"]) {
      write(repo, "agentory/threads/1-a/decisions.md", record(REVERSED).replaceAll("\n", end));
      const reading = readSettle(repo);
      expect(reading.root, end).toBe("agentory");
      expect(reading.kept, end).toEqual([
        {
          directory: "agentory/threads/1-a",
          rows: [{ line: 3, why: "decision 1 is reversed; decided: The work item runs through the review chain, with no framer.; reversal: Frame it first: the change reaches the protocol." }],
        },
      ]);
      const got = run(repo);
      expect(got.code, end).toBe(1);
      expect(got.out, end).toContain(
        "kept agentory/threads/1-a/\n  agentory/threads/1-a/decisions.md:3: decision 1 is reversed; decided: The work item runs through the review chain, with no framer.; reversal: Frame it first: the change reaches the protocol.\n",
      );
    }
  });

  it("is run by the package's script, which prints the reading and exits 1 where it keeps a directory", () => {
    const repo = repository();
    write(repo, "agentory/threads/1-a/decisions.md", record(REVERSED));
    const got = spawnSync(process.execPath, [SCRIPT], { cwd: repo, encoding: "utf8", env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" } });
    expect(got.stderr).toBe("");
    expect(got.stdout).toContain("kept agentory/threads/1-a/\n");
    expect(got.status).toBe(1);
  });

  it("keeps a directory whose record holds an open question, and names the question's id and its text, each row in the record's order", () => {
    const repo = repository();
    write(repo, "agentory/threads/1-a/decisions.md", record(OPEN, REVERSED));
    expect(readSettle(repo).kept).toEqual([
      {
        directory: "agentory/threads/1-a",
        rows: [
          { line: 3, why: "question 2 is open; asks: May the run push the branch to `origin`?" },
          { line: 10, why: "decision 1 is reversed; decided: The work item runs through the review chain, with no framer.; reversal: Frame it first: the change reaches the protocol." },
        ],
      },
    ]);
    const got = run(repo);
    expect(got.code).toBe(1);
    expect(got.out).toContain("kept agentory/threads/1-a/\n  agentory/threads/1-a/decisions.md:3: question 2 is open; asks: May the run push the branch to `origin`?\n");
  });

  it("keeps a directory whose record holds a block the reader refuses, and names the refusal's line and reason", () => {
    const repo = repository();
    write(repo, "agentory/threads/1-a/decisions.md", record(["decision: 1 scope", "decided: No push.", "grounds: None asked.", "state: undone"]));
    expect(readSettle(repo).kept).toEqual([
      {
        directory: "agentory/threads/1-a",
        rows: [
          {
            line: 7,
            why: "the reader refuses the line: `state: undone` does not read whole as `state: <value>`: a decision's state is `decided`, `reversed`, `applied <commit>` with 7 to 40 hex digits, or `carried <home>`",
          },
        ],
      },
    ]);
    expect(run(repo).code).toBe(1);
  });

  it("stops with exit 2 and names the record where a `decisions.md` cannot be read, and keeps reading nothing as a record with nothing open", () => {
    const repo = repository();
    mkdirSync(join(repo, "agentory/threads/1-a/decisions.md"), { recursive: true });
    expect(() => readSettle(repo)).toThrow("agentory/threads/1-a/decisions.md cannot be read");
    const got = run(repo);
    expect([got.code, got.out]).toEqual([2, ""]);
    expect(got.err).toContain("agentory/threads/1-a/decisions.md cannot be read");
  });

  it("stops with exit 2 and names the link where a `decisions.md` links to nothing, `threads/` links to nothing, or a work item's directory is a link, and reads none of them as nothing", () => {
    for (const [made, said] of [
      [(repo: string) => symlinkSync("nowhere.md", join(repo, "agentory/threads/1-a/decisions.md")), "agentory/threads/1-a/decisions.md cannot be read: it is a link to nothing"],
      [(repo: string) => symlinkSync("nowhere", join(repo, "agentory/threads")), "agentory/threads cannot be read: it is a link to nothing"],
      [
        (repo: string) => {
          // The directory behind the link holds a reversal, which a settle that passed the link over would neither keep nor name.
          write(repo, "elsewhere/decisions.md", record(REVERSED));
          symlinkSync("../../elsewhere", join(repo, "agentory/threads/2-b"));
        },
        "agentory/threads/2-b is a link, and the settle reads a work item's directory only where one stands",
      ],
    ] as const) {
      const repo = repository();
      if (said.startsWith("agentory/threads/")) write(repo, "agentory/threads/1-a/routing.md", "# Routing: 1-a\n");
      made(repo);
      expect(() => readSettle(repo), said).toThrow(said);
      const got = run(repo);
      expect([got.code, got.out, got.err], said).toEqual([2, "", `settle: ${said}\n`]);
    }
  });

  it("names a notice of the reader at its line and keeps nothing for it", () => {
    const repo = repository();
    write(repo, "agentory/threads/1-a/decisions.md", ["# Decisions and questions", "", `${F}iadd decision`, "decision: 1 route", F, ""].join("\n"));
    const reading = readSettle(repo);
    expect(reading.kept).toEqual([]);
    expect(reading.notices).toEqual([
      {
        directory: "agentory/threads/1-a",
        line: 3,
        why: "not read: `" + F + "iadd decision` opens a fence like an `iadd` block and is not one, so its lines are no fields; an `iadd` block opens with three backticks and `iadd` alone on the line",
      },
    ]);
    const got = run(repo);
    expect(got.code).toBe(0);
    expect(got.out).toContain("notice agentory/threads/1-a/decisions.md:3: not read: ");
    expect(got.out).not.toContain("kept agentory/threads/");
  });

  it("keeps no directory whose decisions are decided, applied or carried and whose questions are answered, nor one without a record", () => {
    const repo = repository();
    write(
      repo,
      "agentory/threads/1-a/decisions.md",
      record(
        ["decision: 1 route", "decided: No framer.", "grounds: Small.", "state: decided"],
        ["decision: 2 default", "decided: English.", "grounds: The key.", "state: applied 0123abc", "reversal: Korean."],
        ["decision: 3 scope", "decided: No push.", "grounds: None asked.", "state: carried #5", "reversal: Push it."],
        ["question: 4", "asks: Go on?", "grounds: None stands.", "state: answered", "answer: yes"],
      ),
    );
    write(repo, "agentory/threads/2-b/routing.md", "# Routing\n");
    // A file under `threads/` is no work item's directory.
    write(repo, "agentory/threads/notes.md", "# Notes\n");
    const reading = readSettle(repo);
    expect([reading.kept, reading.notices, reading.release.map((item) => item.id)]).toEqual([[], [], ["1-a", "2-b"]]);
    const got = run(repo);
    expect(got.code).toBe(0);
    expect(got.out).toContain("Kept no directory.\n");
  });

  it("keeps a directory by the record HEAD holds where the working tree lacks the record, removed with its directory or alone, as a settle stopped before its commit leaves it, and stops where HEAD holds that record or its directory as a link", () => {
    for (const removed of ["agentory/threads/1-a", "agentory/threads/1-a/decisions.md"]) {
      const repo = repository();
      write(repo, "agentory/threads/1-a/routing.md", "# Routing: 1-a\n");
      write(repo, "agentory/threads/1-a/decisions.md", record(REVERSED));
      write(repo, "agentory/threads/2-b/decisions.md", record(OPEN));
      commit(repo, "chore: two kept work items");
      rmSync(join(repo, removed), { recursive: true });
      expect(readSettle(repo).kept, removed).toEqual([
        {
          directory: "agentory/threads/1-a",
          rows: [{ line: 3, why: "decision 1 is reversed; decided: The work item runs through the review chain, with no framer.; reversal: Frame it first: the change reaches the protocol." }],
        },
        { directory: "agentory/threads/2-b", rows: [{ line: 3, why: "question 2 is open; asks: May the run push the branch to `origin`?" }] },
      ]);
      const got = run(repo);
      expect(got.code, removed).toBe(1);
      expect(got.out, removed).toContain("kept agentory/threads/1-a/\n  agentory/threads/1-a/decisions.md:3: decision 1 is reversed; ");
    }
    for (const [link, target] of [
      ["agentory/threads/1-a/decisions.md", "nowhere.md"],
      ["agentory/threads/1-a", "../../elsewhere"],
    ] as const) {
      const repo = repository();
      write(repo, "elsewhere/decisions.md", record(REVERSED));
      mkdirSync(dirname(join(repo, link)), { recursive: true });
      symlinkSync(target, join(repo, link));
      commit(repo, "chore: a work item that is a link");
      rmSync(join(repo, "agentory/threads/1-a"), { recursive: true });
      const said = `${link} is a link in HEAD, and the settle reads a record only where one stands`;
      expect(() => readSettle(repo), link).toThrow(said);
      expect(run(repo), link).toEqual({ code: 2, out: "", err: `settle: ${said}\n` });
    }
  });

  it("reads nothing and keeps nothing in a repository that holds no records root, and says so", () => {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    write(made.repo, "agentory/threads/1-a/decisions.md", record(REVERSED));
    expect(readSettle(made.repo)).toEqual({ root: null, kept: [], notices: [], since: null, release: [] });
    const got = run(made.repo);
    expect(got.code).toBe(0);
    expect(got.out).toContain("The repository holds no records root.\n");
  });
});

describe("the release's decisions made without asking", () => {
  /** A repository with one work item tagged as the release `v0.0.1`, which keeps a reversed decision, and two work items added after it, the second by a pull request's commit. */
  function released(): { repo: string; before: string } {
    const repo = repository();
    const before = git(repo, "rev-parse", "HEAD").trim();
    write(repo, "agentory/threads/1-a/routing.md", "# Routing: 1-a\n");
    write(repo, "agentory/threads/1-a/decisions.md", record(REVERSED));
    commit(repo, "feat: the first work item (#3)");
    git(repo, "tag", "v0.0.1");
    write(repo, "agentory/threads/2-b/routing.md", "# Routing: 2-b\n");
    write(
      repo,
      "agentory/threads/2-b/decisions.md",
      record(
        ["decision: 1 default", "decided: English.", "grounds: The key is absent.", "by: framer", "state: reversed", "reversal: Korean."],
        ["decision: 2 route", "decided: No framer.", "grounds: Small.", "state: decided"],
      ),
    );
    commit(repo, "chore: frame the second work item");
    write(repo, "agentory/threads/3-c/routing.md", "# Routing: 3-c\n");
    write(repo, "agentory/threads/3-c/decisions.md", record(["decision: 1 default", "decided: No push.", "grounds: None asked.", "state: carried #20", "reversal: Push it."]));
    commit(repo, "feat: the third work item (#12)");
    return { repo, before };
  }

  it("lists the decisions of the work items added since the newest release tag, opening with a count per kind, and names a pull request where the commit that added the routing names one", () => {
    const { repo } = released();
    const reading = readSettle(repo);
    expect(reading.since).toBe("v0.0.1");
    expect(reading.release.map((item) => [item.id, item.pullRequest, item.decisions.map((decision) => decision.id)])).toEqual([
      ["2-b", null, [1, 2]],
      ["3-c", 12, [1]],
    ]);
    // The work item of the earlier release is kept for its reversal and is not listed again.
    expect(reading.kept.map((kept) => kept.directory)).toEqual(["agentory/threads/1-a", "agentory/threads/2-b"]);
    expect(listMarkdown(reading)).toBe(
      [
        "- `route`: 1 decision, 0 reversed by the person",
        "- `default`: 2 decisions, 2 reversed by the person",
        "",
        "### 2-b",
        "",
        "- Decision 1, `default`: English.",
        "  - Grounds: The key is absent.",
        "  - By: framer",
        "  - State: `reversed`: Korean.",
        "- Decision 2, `route`: No framer.",
        "  - Grounds: Small.",
        "  - State: `decided`",
        "",
        "### 3-c (#12)",
        "",
        "- Decision 1, `default`: No push.",
        "  - Grounds: None asked.",
        "  - State: `carried #20`: Push it.",
        "",
      ].join("\n"),
    );
    const got = run(repo, "--list");
    expect([got.code, got.out, got.err]).toEqual([0, listMarkdown(reading), ""]);
  });

  it("lists the work items added since the ref `--since` names, and every work item where no release tag is reachable", () => {
    const { repo, before } = released();
    const ids = (since?: string): string[] => readSettle(repo, since).release.map((item) => item.id);
    expect(ids(before)).toEqual(["1-a", "2-b", "3-c"]);
    expect(run(repo, "--list", "--since", before).out).toContain("### 1-a (#3)\n");
    git(repo, "tag", "--delete", "v0.0.1");
    expect(readSettle(repo).since).toBe(null);
    expect(ids()).toEqual(["1-a", "2-b", "3-c"]);
  });

  it("stops with exit 2 where git cannot read the ref `--since` names, and with its usage where a flag is unknown, `--apply` and `--released-at` among them, or a ref is missing", () => {
    const { repo } = released();
    expect(() => readSettle(repo, "v9.9.9")).toThrow("v9.9.9");
    const unread = run(repo, "--since", "v9.9.9");
    expect([unread.code, unread.out]).toEqual([2, ""]);
    expect(unread.err).toContain("v9.9.9");
    for (const [args, wrong] of [
      [["--since"], "--since names no ref"],
      [["--frobnicate"], "settle does not know `--frobnicate`"],
      [["--apply"], "settle does not know `--apply`"],
      [["--list", "--apply"], "settle does not know `--apply`"],
      [["--released-at", "HEAD"], "settle does not know `--released-at`"],
    ] as const) {
      expect(run(repo, ...args), args.join(" ")).toEqual({ code: 2, out: "", err: `${wrong}\nusage: settle [--list] [--since <ref>]\n` });
    }
  });

  it("names each block of the release the reader refuses in the list's count and on the error stream, and `--list` exits 1 for it", () => {
    const UNDONE = ["decision: 2 scope", "decided: No push.", "grounds: None asked.", "state: undone"];
    const WHY = "the reader refuses the line: `state: undone` does not read whole as `state: <value>`: a decision's state is `decided`, `reversed`, `applied <commit>` with 7 to 40 hex digits, or `carried <home>`";
    const repo = repository();
    write(repo, "agentory/threads/1-a/decisions.md", record(["decision: 1 route", "decided: No framer.", "grounds: Small.", "state: decided"], UNDONE));
    write(repo, "agentory/threads/2-b/decisions.md", record(UNDONE));
    const reading = readSettle(repo);
    expect(reading.release.map((item) => [item.id, item.refused])).toEqual([
      ["1-a", [{ line: 14, why: WHY }]],
      ["2-b", [{ line: 7, why: WHY }]],
    ]);
    const listed = listMarkdown(reading);
    expect(listed.startsWith("- `route`: 1 decision, 0 reversed by the person\n- Not listed: 2 blocks the reader cannot read (`agentory/threads/1-a/decisions.md:14`, `agentory/threads/2-b/decisions.md:7`)\n\n### 1-a\n"), listed).toBe(true);
    const got = run(repo, "--list");
    expect(got).toEqual({ code: 1, out: listed, err: `settle: not listed agentory/threads/1-a/decisions.md:14: ${WHY}\nsettle: not listed agentory/threads/2-b/decisions.md:7: ${WHY}\n` });
    // A release whose only block the reader refuses does not say it holds no decision.
    rmSync(join(repo, "agentory/threads/1-a"), { recursive: true });
    expect(listMarkdown(readSettle(repo))).toBe("- Not listed: 1 block the reader cannot read (`agentory/threads/2-b/decisions.md:7`)\n");
  });

  it("writes each value of the record as the record holds it, escaping outside code spans what Markdown reads as markup, and keeping the code spans the record writes", () => {
    const repo = repository();
    write(
      repo,
      "agentory/threads/1-a/decisions.md",
      record(
        ["decision: 1 route", "decided: Name <ref> as *a*, keep `<raw>` and ``a`b`` as typed.", "grounds: a | b & c_d, an open ` stays [x](y) ~z~ #1 \\n", "by: **orchestrator**", "state: reversed", "reversal: Use <ref> here."],
        ["decision: 2 scope", "decided: No push.", "grounds: None.", "state: carried notes`x", "reversal: Push it."],
        ["decision: 3 scope", "decided: No tag.", "grounds: None.", "state: carried notes`", "reversal: Tag it."],
      ),
    );
    write(repo, "agentory/threads/2-*b*/decisions.md", record(["decision: 1 default", "decided: English.", "grounds: The key.", "state: decided"]));
    expect(listMarkdown(readSettle(repo))).toBe(
      [
        "- `route`: 1 decision, 1 reversed by the person",
        "- `default`: 1 decision, 0 reversed by the person",
        "- `scope`: 2 decisions, 2 reversed by the person",
        "",
        "### 1-a",
        "",
        "- Decision 1, `route`: Name \\<ref\\> as \\*a\\*, keep `<raw>` and ``a`b`` as typed.",
        "  - Grounds: a \\| b \\& c\\_d, an open \\` stays \\[x\\](y) \\~z\\~ \\#1 \\\\n",
        "  - By: \\*\\*orchestrator\\*\\*",
        "  - State: `reversed`: Use \\<ref\\> here.",
        "- Decision 2, `scope`: No push.",
        "  - Grounds: None.",
        "  - State: ``carried notes`x``: Push it.",
        "- Decision 3, `scope`: No tag.",
        "  - Grounds: None.",
        "  - State: `` carried notes` ``: Tag it.",
        "",
        "### 2-\\*b\\*",
        "",
        "- Decision 1, `default`: English.",
        "  - Grounds: The key.",
        "  - State: `decided`",
        "",
      ].join("\n"),
    );
  });

  it("says so where the release holds no decision made without asking", () => {
    const repo = repository();
    write(repo, "agentory/threads/1-a/routing.md", "# Routing: 1-a\n");
    expect(listMarkdown(readSettle(repo))).toBe("No decision was made without asking in this release.\n");
  });
});
