// The release's settle: what it reads of every work item's `decisions.md`,
// which directories it keeps and why, and the list of the release's decisions
// made without asking. The cases read temporary repositories and never
// Owlery's own.
import { spawn, spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MARKER } from "../src/daemon/records-place";
import { command, listMarkdown, readSettle } from "../src/daemon/settle";
import { git, temporaryRepository } from "./repositories";

const SCRIPT = join(__dirname, "..", "scripts", "settle.mjs");

const F = "```";
/** A record of those blocks, each a `seal` block of its lines, after a head of two lines. */
const record = (...blocks: string[][]): string => ["# Decisions and questions", "", ...blocks.flatMap((lines) => [`${F}seal`, ...lines, F, ""])].join("\n");

const REVERSED = [
  "decision: 1 route",
  "decided: The work item runs through the review chain, with no framer.",
  "grounds: The change reaches no protocol.",
  "by: orchestrator",
  "state: reversed",
  "reversal: Frame it first: the change reaches the protocol.",
];
const OPEN = ["question: 2", "asks: May the run push the branch to `origin`?", "grounds: No document grants it.", "state: open"];

/**
 * The path with each folder that holds a `seal` left out, so no case ever
 * reaches AgenticSeal's own `seal settle --apply`: a case of `--apply` puts a
 * stand-in first on it, and every other case runs with no `seal` at all.
 */
const WITHOUT_SEAL = (process.env.PATH ?? "")
  .split(delimiter)
  .filter((folder) => folder !== "" && !existsSync(join(folder, "seal")))
  .join(delimiter);

const cleanups: (() => void)[] = [];
beforeEach(() => {
  vi.stubEnv("PATH", WITHOUT_SEAL);
});
afterEach(() => {
  vi.unstubAllEnvs();
  for (const cleanup of cleanups.splice(0)) cleanup();
});

/** A temporary repository holding a records root, committed. */
function repository(): string {
  const made = temporaryRepository();
  cleanups.push(made.remove);
  write(made.repo, "seal/README.md", `${MARKER}\n`);
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
      write(repo, "seal/threads/1-a/decisions.md", record(REVERSED).replaceAll("\n", end));
      const reading = readSettle(repo);
      expect(reading.root, end).toBe("seal");
      expect(reading.kept, end).toEqual([
        {
          directory: "seal/threads/1-a",
          rows: [{ line: 3, why: "decision 1 is reversed; decided: The work item runs through the review chain, with no framer.; reversal: Frame it first: the change reaches the protocol." }],
        },
      ]);
      const got = run(repo);
      expect(got.code, end).toBe(1);
      expect(got.out, end).toContain(
        "kept seal/threads/1-a/\n  seal/threads/1-a/decisions.md:3: decision 1 is reversed; decided: The work item runs through the review chain, with no framer.; reversal: Frame it first: the change reaches the protocol.\n",
      );
    }
  });

  it("is run by the package's script, which prints the reading and exits 1 where it keeps a directory", () => {
    const repo = repository();
    write(repo, "seal/threads/1-a/decisions.md", record(REVERSED));
    const got = spawnSync(process.execPath, [SCRIPT], { cwd: repo, encoding: "utf8", env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" } });
    expect(got.stderr).toBe("");
    expect(got.stdout).toContain("kept seal/threads/1-a/\n");
    expect(got.status).toBe(1);
  });

  it("keeps a directory whose record holds an open question, and names the question's id and its text, each row in the record's order", () => {
    const repo = repository();
    write(repo, "seal/threads/1-a/decisions.md", record(OPEN, REVERSED));
    expect(readSettle(repo).kept).toEqual([
      {
        directory: "seal/threads/1-a",
        rows: [
          { line: 3, why: "question 2 is open; asks: May the run push the branch to `origin`?" },
          { line: 10, why: "decision 1 is reversed; decided: The work item runs through the review chain, with no framer.; reversal: Frame it first: the change reaches the protocol." },
        ],
      },
    ]);
    const got = run(repo);
    expect(got.code).toBe(1);
    expect(got.out).toContain("kept seal/threads/1-a/\n  seal/threads/1-a/decisions.md:3: question 2 is open; asks: May the run push the branch to `origin`?\n");
  });

  it("keeps a directory whose record holds a block the reader refuses, and names the refusal's line and reason", () => {
    const repo = repository();
    write(repo, "seal/threads/1-a/decisions.md", record(["decision: 1 scope", "decided: No push.", "grounds: None asked.", "state: undone"]));
    expect(readSettle(repo).kept).toEqual([
      {
        directory: "seal/threads/1-a",
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
    mkdirSync(join(repo, "seal/threads/1-a/decisions.md"), { recursive: true });
    expect(() => readSettle(repo)).toThrow("seal/threads/1-a/decisions.md cannot be read");
    const got = run(repo);
    expect([got.code, got.out]).toEqual([2, ""]);
    expect(got.err).toContain("seal/threads/1-a/decisions.md cannot be read");
  });

  it("stops with exit 2 and names the link where a `decisions.md` links to nothing, `threads/` links to nothing, or a work item's directory is a link, and reads none of them as nothing", () => {
    for (const [made, said] of [
      [(repo: string) => symlinkSync("nowhere.md", join(repo, "seal/threads/1-a/decisions.md")), "seal/threads/1-a/decisions.md cannot be read: it is a link to nothing"],
      [(repo: string) => symlinkSync("nowhere", join(repo, "seal/threads")), "seal/threads cannot be read: it is a link to nothing"],
      [
        (repo: string) => {
          // The directory behind the link holds a reversal, which a settle that passed the link over would neither keep nor name.
          write(repo, "elsewhere/decisions.md", record(REVERSED));
          symlinkSync("../../elsewhere", join(repo, "seal/threads/2-b"));
        },
        "seal/threads/2-b is a link, and the settle reads a work item's directory only where one stands",
      ],
    ] as const) {
      const repo = repository();
      if (said.startsWith("seal/threads/")) write(repo, "seal/threads/1-a/routing.md", "# Routing: 1-a\n");
      made(repo);
      expect(() => readSettle(repo), said).toThrow(said);
      const got = run(repo);
      expect([got.code, got.out, got.err], said).toEqual([2, "", `settle: ${said}\n`]);
    }
  });

  it("names a notice of the reader at its line and keeps nothing for it", () => {
    const repo = repository();
    write(repo, "seal/threads/1-a/decisions.md", ["# Decisions and questions", "", `${F}seal decision`, "decision: 1 route", F, ""].join("\n"));
    const reading = readSettle(repo);
    expect(reading.kept).toEqual([]);
    expect(reading.notices).toEqual([
      {
        directory: "seal/threads/1-a",
        line: 3,
        why: "not read: `" + F + "seal decision` opens a fence like a `seal` block and is not one, so its lines are no fields; a `seal` block opens with three backticks and `seal` alone on the line",
      },
    ]);
    const got = run(repo);
    expect(got.code).toBe(0);
    expect(got.out).toContain("notice seal/threads/1-a/decisions.md:3: not read: ");
    expect(got.out).not.toContain("kept seal/threads/");
  });

  it("keeps no directory whose decisions are decided, applied or carried and whose questions are answered, nor one without a record", () => {
    const repo = repository();
    write(
      repo,
      "seal/threads/1-a/decisions.md",
      record(
        ["decision: 1 route", "decided: No framer.", "grounds: Small.", "state: decided"],
        ["decision: 2 default", "decided: English.", "grounds: The key.", "state: applied 0123abc", "reversal: Korean."],
        ["decision: 3 scope", "decided: No push.", "grounds: None asked.", "state: carried #5", "reversal: Push it."],
        ["question: 4", "asks: Go on?", "grounds: None stands.", "state: answered", "answer: yes"],
      ),
    );
    write(repo, "seal/threads/2-b/routing.md", "# Routing\n");
    // A file under `threads/` is no work item's directory.
    write(repo, "seal/threads/notes.md", "# Notes\n");
    const reading = readSettle(repo);
    expect([reading.kept, reading.notices, reading.release.map((item) => item.id)]).toEqual([[], [], ["1-a", "2-b"]]);
    const got = run(repo);
    expect(got.code).toBe(0);
    expect(got.out).toContain("Kept no directory.\n");
  });

  it("keeps a directory by the record HEAD holds where the working tree lacks the record, removed with its directory or alone, as an interrupted `--apply` leaves it, and stops where that record is a link", () => {
    for (const removed of ["seal/threads/1-a", "seal/threads/1-a/decisions.md"]) {
      const repo = repository();
      write(repo, "seal/threads/1-a/routing.md", "# Routing: 1-a\n");
      write(repo, "seal/threads/1-a/decisions.md", record(REVERSED));
      write(repo, "seal/threads/2-b/decisions.md", record(OPEN));
      commit(repo, "chore: two kept work items");
      rmSync(join(repo, removed), { recursive: true });
      expect(readSettle(repo).kept, removed).toEqual([
        {
          directory: "seal/threads/1-a",
          rows: [{ line: 3, why: "decision 1 is reversed; decided: The work item runs through the review chain, with no framer.; reversal: Frame it first: the change reaches the protocol." }],
        },
        { directory: "seal/threads/2-b", rows: [{ line: 3, why: "question 2 is open; asks: May the run push the branch to `origin`?" }] },
      ]);
      const got = run(repo);
      expect(got.code, removed).toBe(1);
      expect(got.out, removed).toContain("kept seal/threads/1-a/\n  seal/threads/1-a/decisions.md:3: decision 1 is reversed; ");
    }
    const repo = repository();
    write(repo, "seal/threads/1-a/routing.md", "# Routing: 1-a\n");
    symlinkSync("nowhere.md", join(repo, "seal/threads/1-a/decisions.md"));
    commit(repo, "chore: a record that is a link");
    rmSync(join(repo, "seal/threads/1-a"), { recursive: true });
    const said = "seal/threads/1-a/decisions.md is a link in HEAD, and the settle reads a record only where one stands";
    expect(() => readSettle(repo)).toThrow(said);
    expect(run(repo)).toEqual({ code: 2, out: "", err: `settle: ${said}\n` });
  });

  it("reads nothing and keeps nothing in a repository that holds no records root, and says so", () => {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    write(made.repo, "seal/threads/1-a/decisions.md", record(REVERSED));
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
    write(repo, "seal/threads/1-a/routing.md", "# Routing: 1-a\n");
    write(repo, "seal/threads/1-a/decisions.md", record(REVERSED));
    commit(repo, "feat: the first work item (#3)");
    git(repo, "tag", "v0.0.1");
    write(repo, "seal/threads/2-b/routing.md", "# Routing: 2-b\n");
    write(
      repo,
      "seal/threads/2-b/decisions.md",
      record(
        ["decision: 1 default", "decided: English.", "grounds: The key is absent.", "by: framer", "state: reversed", "reversal: Korean."],
        ["decision: 2 route", "decided: No framer.", "grounds: Small.", "state: decided"],
      ),
    );
    commit(repo, "chore: frame the second work item");
    write(repo, "seal/threads/3-c/routing.md", "# Routing: 3-c\n");
    write(repo, "seal/threads/3-c/decisions.md", record(["decision: 1 default", "decided: No push.", "grounds: None asked.", "state: carried #20", "reversal: Push it."]));
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
    expect(reading.kept.map((kept) => kept.directory)).toEqual(["seal/threads/1-a", "seal/threads/2-b"]);
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

  it("stops with exit 2 where git cannot read the ref `--since` names, and with its usage where a flag is unknown, a ref is missing, or the flags do not run together", () => {
    const { repo } = released();
    expect(() => readSettle(repo, "v9.9.9")).toThrow("v9.9.9");
    const unread = run(repo, "--since", "v9.9.9");
    expect([unread.code, unread.out]).toEqual([2, ""]);
    expect(unread.err).toContain("v9.9.9");
    for (const args of [["--since"], ["--frobnicate"], ["--apply", "--released-at"], ["--released-at", "HEAD"], ["--apply", "--list"]]) {
      const got = run(repo, ...args);
      expect([got.code, got.out], args.join(" ")).toEqual([2, ""]);
      expect(got.err, args.join(" ")).toContain("\nusage: settle [--list | --apply [--released-at <ref>]] [--since <ref>]\n");
    }
  });

  it("says so where the release holds no decision made without asking", () => {
    const repo = repository();
    write(repo, "seal/threads/1-a/routing.md", "# Routing: 1-a\n");
    expect(listMarkdown(readSettle(repo))).toBe("No decision was made without asking in this release.\n");
  });
});

describe("`--apply`, which runs AgenticSeal's settle and puts back each directory it kept", () => {
  const CLOSED = ["decision: 1 route", "decided: No framer.", "grounds: Small.", "state: decided"];
  /** Removes every directory under `threads/`, as AgenticSeal's settle removes a released one, and says so. */
  const REMOVE_ALL = `for d in seal/threads/*/; do rm -rf "$d"; printf 'removed %s\\n' "$d"; done`;

  /**
   * Puts a stand-in for AgenticSeal's `seal` first on the path: a shell
   * script that notes it ran, prints the arguments it was given, and then
   * runs those lines in the folder it was started in.
   */
  function standIn(...lines: string[]): { ran: () => boolean } {
    const folder = realpathSync(mkdtempSync(join(tmpdir(), "owlery-seal-stand-in-")));
    cleanups.push(() => rmSync(folder, { recursive: true, force: true }));
    const noted = join(folder, "ran");
    writeFileSync(join(folder, "seal"), ["#!/bin/sh", `: > '${noted}'`, 'printf "stand-in seal %s\\n" "$*"', ...lines, ""].join("\n"), { mode: 0o755 });
    vi.stubEnv("PATH", `${folder}${delimiter}${WITHOUT_SEAL}`);
    return { ran: () => existsSync(noted) };
  }

  /** A repository whose records hold `1-a`, kept for a reversed decision, and `2-b`, closed, both committed. */
  function settled(): string {
    const repo = repository();
    write(repo, "seal/threads/1-a/decisions.md", record(REVERSED));
    write(repo, "seal/threads/2-b/decisions.md", `${record(CLOSED)}${F}seal decision\ndecision: 9 route\n${F}\n`);
    commit(repo, "chore: two work items");
    return repo;
  }

  it("names each kept directory with its rows before it runs AgenticSeal's settle with the ref it was given, lets its output through, puts back the directory it kept, and leaves the closed one removed", () => {
    const repo = settled();
    const seal = standIn(REMOVE_ALL);
    const got = run(repo, "--apply", "--released-at", "HEAD");
    expect(seal.ran()).toBe(true);
    expect(got.out).toContain("notice seal/threads/2-b/decisions.md:9: not read: ");
    expect(got.out).toContain(
      "keeping seal/threads/1-a/\n  seal/threads/1-a/decisions.md:3: decision 1 is reversed; decided: The work item runs through the review chain, with no framer.; reversal: Frame it first: the change reaches the protocol.\n" +
        "stand-in seal settle --apply --released-at HEAD\nremoved seal/threads/1-a/\nremoved seal/threads/2-b/\n",
    );
    expect(got.out.endsWith("\nremoved seal/threads/2-b/\nput back seal/threads/1-a/\nPut back 1 directory.\n"), got.out).toBe(true);
    expect(git(repo, "status", "--short", "--", "seal/threads/1-a")).toBe("");
    expect(existsSync(join(repo, "seal/threads/2-b"))).toBe(false);
    expect([got.code, got.err]).toEqual([1, ""]);
  });

  it("exits 2 where AgenticSeal's settle exits 2, any exit but 0 or 1, or no exit, 1 where either kept a directory, and 0 otherwise, and lets AgenticSeal's errors through", () => {
    const repo = repository();
    write(repo, "seal/threads/2-b/decisions.md", record(CLOSED));
    commit(repo, "chore: a closed work item");
    for (const [theirs, want] of [
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 2],
    ]) {
      standIn(`echo 'the settle exits ${theirs}' >&2`, `exit ${theirs}`);
      const got = run(repo, "--apply");
      expect([got.code, got.err], `exit ${theirs}`).toEqual([want, `the settle exits ${theirs}\n`]);
      expect(got.out, `exit ${theirs}`).toBe("stand-in seal settle --apply\nPut back no directory.\n");
    }
    standIn("kill -9 $$");
    const killed = run(repo, "--apply");
    expect(killed.code).toBe(2);
    expect(killed.err).toContain("SIGKILL");
    // A `seal` whose interpreter does not stand is found and does not start.
    const folder = realpathSync(mkdtempSync(join(tmpdir(), "owlery-seal-stand-in-")));
    cleanups.push(() => rmSync(folder, { recursive: true, force: true }));
    writeFileSync(join(folder, "seal"), "#!/owlery/no/such/sh\n", { mode: 0o755 });
    vi.stubEnv("PATH", `${folder}${delimiter}${WITHOUT_SEAL}`);
    const unstarted = run(repo, "--apply");
    expect(unstarted.code).toBe(2);
    expect(unstarted.err).toContain("settle: seal settle --apply did not run: ");
    // A kept directory the settle left as it was is not put back.
    write(repo, "seal/threads/1-a/decisions.md", record(REVERSED));
    commit(repo, "chore: a kept work item");
    standIn("exit 2");
    const kept = run(repo, "--apply");
    expect(kept.code).toBe(2);
    expect(kept.out.endsWith("\nPut back no directory.\n"), kept.out).toBe(true);
  });

  it("refuses, runs nothing and names the directory where a kept directory differs from HEAD, by an edit or by a file not committed, whatever `status.showUntrackedFiles` the repository sets", () => {
    for (const change of [
      (repo: string) => write(repo, "seal/threads/1-a/decisions.md", record(REVERSED, OPEN)),
      (repo: string) => write(repo, "seal/threads/1-a/notes.md", "# Notes\n"),
      (repo: string) => {
        git(repo, "config", "status.showUntrackedFiles", "no");
        write(repo, "seal/threads/1-a/notes.md", "# Notes\n");
      },
    ]) {
      const repo = settled();
      const seal = standIn(REMOVE_ALL);
      change(repo);
      const got = run(repo, "--apply");
      expect([got.code, got.out]).toEqual([2, ""]);
      expect(got.err).toContain("settle: seal/threads/1-a/ differs from HEAD, and a kept directory is put back from HEAD: commit or undo its changes first\n");
      expect(got.err).not.toContain("seal/threads/2-b/");
      expect(seal.ran()).toBe(false);
      expect(existsSync(join(repo, "seal/threads/2-b"))).toBe(true);
    }
  });

  it("puts nothing back and names each kept directory as not put back where AgenticSeal's settle moved HEAD, to a commit or to one git cannot read", () => {
    for (const move of ["git add --all && git commit --quiet -m 'chore: settle'", "printf 'no ref\\n' > .git/HEAD"]) {
      const repo = settled();
      standIn(REMOVE_ALL, move);
      const got = run(repo, "--apply");
      expect(got.code, move).toBe(2);
      expect(got.err, move).toMatch(/^settle: not put back seal\/threads\/1-a\/: HEAD moved from [0-9a-f]{40} to .+ while seal settle --apply ran\n$/);
      expect(got.out, move).toContain("keeping seal/threads/1-a/\n  seal/threads/1-a/decisions.md:3: decision 1 is reversed; ");
      expect(existsSync(join(repo, "seal/threads/1-a")), move).toBe(false);
      expect(got.out.endsWith("\nPut back no directory.\n"), got.out).toBe(true);
    }
  });

  /** A folder of its own for the system's temporary directory of a run of the package's script. */
  function temporaryFolder(): string {
    const folder = realpathSync(mkdtempSync(join(tmpdir(), "owlery-settle-tmp-")));
    cleanups.push(() => rmSync(folder, { recursive: true, force: true }));
    return folder;
  }

  /**
   * Runs the package's script with `--apply` in the repository, as the leader
   * of a process group of its own, as a terminal starts a command, with
   * `TMPDIR` set to the folder given, and gives how it ended and what it printed.
   */
  function scriptApply(repo: string, tmp: string): Promise<{ code: number | null; signal: NodeJS.Signals | null; out: string; err: string }> {
    return new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [SCRIPT, "--apply"], { cwd: repo, detached: true, env: { ...process.env, ELECTRON_RUN_AS_NODE: "1", TMPDIR: tmp } });
      let out = "";
      let err = "";
      child.stdout.on("data", (chunk) => (out += String(chunk)));
      child.stderr.on("data", (chunk) => (err += String(chunk)));
      child.on("error", reject);
      child.on("close", (code, signal) => resolve({ code, signal, out, err }));
    });
  }

  it("holds SIGINT, SIGTERM and SIGHUP while AgenticSeal's settle runs, so a signal to the run's process group ends the settle and still puts back what it kept", async () => {
    for (const signal of ["INT", "TERM", "HUP"]) {
      const repo = settled();
      standIn(REMOVE_ALL, `kill -s ${signal} 0`);
      const got = await scriptApply(repo, temporaryFolder());
      expect([got.code, got.signal], signal).toEqual([2, null]);
      expect(got.err, signal).toBe(`settle: seal settle --apply ended on SIG${signal} with no exit code\n`);
      expect(got.out.endsWith("\nput back seal/threads/1-a/\nPut back 1 directory.\n"), `${signal}: ${got.out}`).toBe(true);
      expect(git(repo, "status", "--short", "--", "seal/threads/1-a"), signal).toBe("");
    }
  });

  it("leaves on the screen each kept directory with its rows, and no bundle on the disk, where the run is killed, and the next `--apply` refuses the directory it left removed", async () => {
    const repo = settled();
    standIn(REMOVE_ALL, "kill -s KILL 0");
    const tmp = temporaryFolder();
    const got = await scriptApply(repo, tmp);
    expect(got.signal).toBe("SIGKILL");
    expect(got.out).toContain(
      "keeping seal/threads/1-a/\n  seal/threads/1-a/decisions.md:3: decision 1 is reversed; decided: The work item runs through the review chain, with no framer.; reversal: Frame it first: the change reaches the protocol.\n",
    );
    expect(readdirSync(tmp)).toEqual([]);
    expect(existsSync(join(repo, "seal/threads/1-a"))).toBe(false);
    const again = run(repo, "--apply");
    expect(again).toEqual({
      code: 2,
      out: "",
      err: "settle: seal/threads/1-a/ differs from HEAD, and a kept directory is put back from HEAD: commit or undo its changes first\nsettle: --apply ran nothing.\n",
    });
  });

  it("names each kept directory it could not put back, and goes on to the next", () => {
    const repo = settled();
    write(repo, "seal/threads/3-c/decisions.md", record(OPEN));
    commit(repo, "chore: a third work item");
    // The settle leaves `threads/` a folder nothing can be written in, so no checkout can make a directory there.
    standIn(REMOVE_ALL, "chmod 555 seal/threads");
    try {
      const got = run(repo, "--apply");
      expect(got.code).toBe(2);
      for (const id of ["1-a", "3-c"]) expect(got.err, id).toContain(`settle: not put back seal/threads/${id}/: git checkout HEAD -- seal/threads/${id}/ failed`);
      expect(got.err).not.toContain("decisions.md:3:");
      expect(got.out).toContain("keeping seal/threads/3-c/\n  seal/threads/3-c/decisions.md:3: question 2 is open; asks: May the run push the branch to `origin`?\n");
      expect(got.out.endsWith("\nPut back no directory.\n"), got.out).toBe(true);
    } finally {
      chmodSync(join(repo, "seal/threads"), 0o755);
    }
  });

  it("refuses and removes nothing where no `seal` on the path can be run", () => {
    const repo = settled();
    const folder = realpathSync(mkdtempSync(join(tmpdir(), "owlery-seal-stand-in-")));
    cleanups.push(() => rmSync(folder, { recursive: true, force: true }));
    // A `seal` that cannot be run is not found either, and nor is a folder named `seal`.
    writeFileSync(join(folder, "seal"), "#!/bin/sh\nrm -rf seal/threads\n", { mode: 0o644 });
    mkdirSync(join(folder, "holder", "seal"), { recursive: true });
    for (const path of [WITHOUT_SEAL, `${folder}${delimiter}${WITHOUT_SEAL}`, `${join(folder, "holder")}${delimiter}${WITHOUT_SEAL}`]) {
      vi.stubEnv("PATH", path);
      const got = run(repo, "--apply");
      expect([got.code, got.out]).toEqual([2, ""]);
      expect(got.err).toContain("settle: `seal` is not found on the path, so AgenticSeal's settle cannot run\n");
      expect(git(repo, "status", "--porcelain")).toBe("");
    }
  });
});
