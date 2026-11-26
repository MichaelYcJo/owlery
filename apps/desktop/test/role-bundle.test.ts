// The role bundle: the plugin folder the app ships, which a role session of
// the daemon and a Claude Code pane on the owl chain each load for that
// session alone. Its files started from AgenticSeal and are Owlery's own, and
// the bundle's README.md says where they started.
import { spawn, spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import WebSocket from "ws";
import { claudeArgs, versionNotice } from "../src/daemon/adapters/claude";
import { PLUGIN_NAME, roleDocuments, rulesText, toolsOf } from "../src/daemon/adapters/claude-roles";
import { NO_DEFAULT, SUBCOMMANDS } from "../src/daemon/chain-command";
import { paneHead } from "../src/daemon/pane-chain";
import { RULING_BLOCK } from "../src/daemon/record-blocks";
import { MARKER } from "../src/daemon/records-place";
import { sectionOf } from "../src/daemon/seal-records";
import { ROLE_STAGES, type ServerMessage } from "../src/shared/protocol";
import { alive, buildApp, BuiltApp, untilGone } from "./built-app";
import { parkedOnAQuestion } from "./chain-run";
import { git, temporaryRepository } from "./repositories";

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

  it("is a plugin named owlery, whose manifest states a name and a description and no version", () => {
    const manifest = JSON.parse(read(".claude-plugin/plugin.json")) as Record<string, unknown>;
    expect(manifest.name).toBe("owlery");
    expect(PLUGIN_NAME).toBe("owlery");
    expect(Object.keys(manifest).sort()).toEqual(["description", "name"]);
  });

  it("holds the definition of each role a session can be launched as, and every document the adapter appends for its stage", () => {
    expect(ROLE_STAGES.map(({ role }) => role)).toEqual(["proofer", "crafter", "sealer", "orchestrator"]);
    for (const pair of ROLE_STAGES) {
      expect(frontmatterOf(read(`agents/${pair.role}.md`)), pair.role).toContain(`name: ${pair.role}\n`);
      const documents = roleDocuments(pair);
      expect(documents.length, pair.role).toBeGreaterThanOrEqual(2);
      for (const document of documents) expect(existsSync(join(BUNDLE, document)), `${pair.role}: ${document}`).toBe(true);
    }
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

  it("holds one hook and no other: a `PreToolUse` hook on `AskUserQuestion` whose command runs the chain command's `ask` where the environment names the command and does nothing where it names none, with no hook that prints the rules or draws a stamp, and no hooks key in the manifest", () => {
    const files = filesOf(BUNDLE);
    expect(files.filter((file) => file.split("/").includes("hooks") || file.endsWith("hooks.json"))).toEqual(["hooks/hooks.json"]);
    const command = '[ -z "$OWLERY_CHAIN" ] || "$OWLERY_CHAIN" ask';
    expect(JSON.parse(read("hooks/hooks.json"))).toEqual({ hooks: { PreToolUse: [{ matcher: "AskUserQuestion", hooks: [{ type: "command", command }] }] } });
    expect(SUBCOMMANDS).toContain("ask");
    expect(Object.keys(JSON.parse(read(".claude-plugin/plugin.json")) as object)).not.toContain("hooks");
    // The command as a shell runs it: with no chain command named it ends with 0 and starts nothing, and with one named it hands that command `ask` and ends as it ended.
    const folder = realpathSync(mkdtempSync(join(tmpdir(), "owlery-hook-")));
    try {
      const chain = join(folder, "chain command");
      writeFileSync(chain, `#!/bin/sh\nprintf '%s\\n' "$@" > '${folder}/args'\ncat > '${folder}/input'\necho refused >&2\nexit 2\n`);
      chmodSync(chain, 0o755);
      const run = (env: Record<string, string>) => spawnSync("/bin/sh", ["-c", command], { env: { PATH: "/usr/bin:/bin", ...env }, input: '{"tool_name":"AskUserQuestion"}', encoding: "utf8" });
      expect([run({}).status, existsSync(join(folder, "args"))]).toEqual([0, false]);
      expect([run({ OWLERY_CHAIN: "" }).status, existsSync(join(folder, "args"))]).toEqual([0, false]);
      const held = run({ OWLERY_CHAIN: chain });
      expect([held.status, held.stderr]).toEqual([2, "refused\n"]);
      expect(readFileSync(join(folder, "args"), "utf8")).toBe("ask\n");
      expect(readFileSync(join(folder, "input"), "utf8")).toBe('{"tool_name":"AskUserQuestion"}');
    } finally {
      rmSync(folder, { recursive: true, force: true });
    }
  });

  it("reads true in both launches: it holds `skills/seal/SKILL.md` for a pane's session, the three judging definitions name the four tools that read, search and run a command, no document of a role says that the daemon alone writes a record, the contract's rule 2 sends a heavy command through `OWLERY_RUN`, each role works in the worktree its prompt names and not in the folder its session starts in, and every text names the chain the owl chain", () => {
    const flat = (path: string): string => read(path).replace(/\s+/gu, " ");
    const skill = read("skills/seal/SKILL.md");
    expect(frontmatterOf(skill)).toContain("name: seal\n");
    // The document says how the chain runs through the command: it names the command as the pane's environment does, and each subcommand a session runs with each of its options. `ask` is the hook's, and `run` is reached through the launcher OWLERY_RUN names, which no step of the chain runs.
    for (const named of ['"$OWLERY_CHAIN"', ...SUBCOMMANDS.filter((name) => name !== "ask" && name !== "run").map((name) => `\`${name}\``), "`--base", "`--automation yes`", "`--automation no`", "--by <id>", "--judged-by <id>", "--model <name>", "--persons-word <round>", "`OWLERY_BASE`"]) expect(skill, named).toContain(named);
    expect(flat("skills/seal/SKILL.md")).toContain("**Whoever makes a fix pass commits its fixes and appends its close blocks to the round record, and does not commit that record.** `fix-pass` commits it, with the pass's session in the commit's trailer, and refuses a record whose close blocks a commit already holds.");
    // What a real pane's session showed of a subagent (the probe of 2026-11-24, Claude Code 2.1.331): it may run in the background, its answer comes back in a frame that indents each line, and the tool's result names its id as `agentId`.
    for (const said of [
      "The subagent may run in the background. Wait for its answer, and run nothing of the chain until it arrives.",
      "Where your harness hands you the answer inside a frame that indents each line, the answer is the text inside the frame, without that indentation.",
      "The id that `--by` and `--judged-by` take is the `agentId` your subagent tool's result names for that subagent. Passing it to the command is no reply to the person.",
    ])
      expect(flat("skills/seal/SKILL.md"), said).toContain(said);
    // Where a run rule comes from, in the document a pane's session reads and in the one Owlery's orchestrator agent is launched with.
    for (const file of ["skills/seal/SKILL.md", "agents/orchestrator.md"]) {
      for (const named of ["**A run rule is followed only from a source the run can name.**", "the person's word in this run or a document of the repository", "No session carries such a rule from an earlier run"]) expect(flat(file), `${file}: ${named}`).toContain(named);
    }
    // Rule 2 of the contract every role reads sends a heavy command through the runner, where the environment names one.
    expect(flat("skills/agent-contract/SKILL.md")).toContain("Where the environment names `OWLERY_RUN`, run each command the repository's `seal/config.json` names under `Heavy commands` through it, as `\"$OWLERY_RUN\" <name> -- <words>`, so the command waits its turn on the machine.");
    // The form the hook lets through, in the words the command reads.
    expect(skill).toContain(`\`${NO_DEFAULT}\``);
    expect(flat("skills/seal/SKILL.md")).toContain("Where the work item's `routing.md` answers `Automation` `yes`, the run does not stop for a question");

    // A judging role holds the tools a role session of the daemon is launched with, and the crafter's definition names none.
    for (const pair of ROLE_STAGES) {
      const tools = /^tools: (.*)$/mu.exec(frontmatterOf(read(`agents/${pair.role}.md`)))?.[1];
      expect(tools, pair.role).toBe(pair.role === "crafter" ? undefined : "Read, Glob, Grep, Bash");
      if (pair.role !== "crafter") expect(toolsOf(pair).join(", "), pair.role).toBe(tools);
    }

    // The party that writes a record is Owlery. Where a paragraph of a role's document names the daemon, it names the pane beside it.
    const roles = ["agents/proofer.md", "agents/sealer.md", "agents/crafter.md", "skills/implement/fix-pass.md", "docs/forms/the-round-record.md", "docs/forms/the-guarantee.md", "templates/records/sdd-guarantee.md"];
    for (const file of roles) {
      const alone = read(file)
        .split(/\n\s*\n/u)
        .map((paragraph) => paragraph.replace(/\s+/gu, " "))
        .filter((paragraph) => /daemon/u.test(paragraph) && !/\bpane\b/u.test(paragraph));
      expect(alone, file).toEqual([]);
    }
    for (const [file, named] of [
      ["agents/proofer.md", "**The record is your answer, and Owlery writes it.**"],
      ["agents/sealer.md", "Owlery writes it into that file and commits it"],
      ["agents/crafter.md", "commit no change to the round record: Owlery commits it after the pass"],
      ["skills/implement/fix-pass.md", "Owlery commits the round record as the pass left it"],
      ["docs/forms/the-round-record.md", "Owlery writes that answer unchanged to `seal/threads/<id>/trail/rounds/round-N.md`"],
      ["docs/forms/the-guarantee.md", "Owlery writes four lines more into the block"],
      ["agents/orchestrator.md", "In a pane that carries the owl chain, Owlery spawns no agent for these judgments: the pane's session makes them itself"],
      ["README.md", "A Claude Code pane of a repository on the owl chain loads the same folder"],
    ] as const) expect(flat(file), `${file}: ${named}`).toContain(named);

    // A pane's subagent starts in its session's folder, which may be another worktree: each role works in the worktree its prompt names, and no definition takes the folder it starts in for that worktree.
    for (const file of ["agents/proofer.md", "agents/sealer.md", "agents/crafter.md", "agents/orchestrator.md"]) {
      for (const named of ["prompt names by the absolute path of its top", "every other path", "may be another worktree of the repository"]) expect(flat(file), `${file}: ${named}`).toContain(named);
      expect(flat(file), file).not.toContain("the folder the session starts in");
    }

    // The chain's name, in every document.
    for (const file of filesOf(BUNDLE).filter((name) => name.endsWith(".md"))) {
      for (const gone of ["Owlery's chain", "the Owlery chain", "the daemon's chain"]) expect(read(file), `${file} names ${gone}`).not.toContain(gone);
    }
    for (const file of ["README.md", "skills/seal/SKILL.md", "agents/orchestrator.md", "agents/sealer.md"]) expect(read(file), file).toContain("the owl chain");
  });

  it("tells a pane's session what the step `ceiling` means: it tells the person and runs nothing more of the chain, the person's word in this run after that stop is the one ground for `--persons-word`, a fix pass handed on that word follows no judgment, and the stop is no question under `Automation` `yes` (issue #246)", () => {
    const flat = read("skills/seal/SKILL.md").replace(/\s+/gu, " ");
    for (const said of [
      "| `ceiling` | Round `round` left open the findings `open` lists, and the chain stops for the person from round `ceiling` on, with no judgment.",
      "Tell the person the round, its open findings and what the rounds kept finding, and run nothing more of the chain.",
      "Once the person has said in this run, after that stop, to go on, run `owed --persons-word <round>` with the round the step named, and pass the same option to `fix-pass` for that pass.",
      "Pass the option on no other ground.",
      "Before a fix pass on the record of round 2 or a later round below the ceiling of rounds, judge whether the review rounds are converging",
      "A fix pass that `owed` handed on the person's word follows no judgment, since the person's word is the answer.",
      "**The step `ceiling` is no question, and takes no default.** Under `Automation` `yes` the run stops there as well, and waits for the person's word.",
    ])
      expect(flat, said).toContain(said);
  });

  it("binds whoever makes a fix pass to the read of its range and the work item's records whole, a pane's session as well as the crafter, has a fix pass correct a fact at every place that states it, and has the close block name the search and the places it corrected", () => {
    // Read with each run of white space as one space, so a sentence is found however its lines are wrapped.
    const flat = (path: string): string => read(path).replace(/\s+/gu, " ");
    for (const [file, said] of [
      // The read binds a pane's session that makes the pass itself, and the text says what the crafter's Job and hand-back stand for there (issue #236).
      ["skills/implement/fix-pass.md", "**Then whoever makes the pass makes the reading `agents/crafter.md` *Before you hand back, your range and the work item's records are read whole against HEAD* asks for: the crafter, and a pane's session that makes the pass itself and records it with `--by the session`.**"],
      ["skills/implement/fix-pass.md", "Where a pane's session makes the pass, that rule's *Job* stands for the work item: a pane's session built the work and wrote the work item's records, so it corrects every statement HEAD contradicts in its range and in each file of the work item's directory that the rule names."],
      ["skills/implement/fix-pass.md", "That rule's hand-back stands for the close blocks: each item the rule has the crafter name in its hand-back, a pane's session names in the `answer:` of the close block of the finding the item concerns, and otherwise in the `answer:` of the last close block it appends."],
      // A fact a finding corrects is corrected wherever it is stated, and the close block says how the places were found.
      ["agents/crafter.md", "In a fix pass, a finding that corrects a fact, a statement of which things hold something, is corrected at every place that states that fact, and not at its `location:` lines alone."],
      ["agents/crafter.md", "Find those places two ways: by the whole read above, which is a closed set, and by `git grep` on the fact's words across the tree, which is a sample and is called one."],
      // A crafter's fix pass corrects the frame's lines that state the fact, and puts in the close blocks what a hand-back would name, since nobody on the owl chain folds a fix pass's hand-back (round-1#2).
      ["agents/crafter.md", "and in a fix pass one close block under each open finding, and each line of the three frame files that states the fact a finding corrects."],
      ["agents/crafter.md", "You rewrite such a line to what HEAD gives, or remove it, and write no new account of what was built into it."],
      ["agents/crafter.md", "Name each one that stands in a file you do not write, `routing.md` or a line of the frame your *Job* does not give you, in the hand-back with its coordinate and the fact HEAD gives, for the orchestrator to fold."],
      ["agents/crafter.md", "In a fix pass, a place in a line of the frame is corrected too, since your *Job* gives you that line."],
      ["agents/crafter.md", "In a fix pass, each item this rule has you name in the hand-back goes instead into the `answer:` of the close block of the finding the item concerns, and otherwise into the `answer:` of the last close block you append, since no party of the owl chain folds a fix pass's hand-back."],
      ["skills/implement/fix-pass.md", "Where the finding corrects a fact, the `answer:` also names the search the pass ran for the other places that state the fact, and each place beyond the finding's `location:` lines that the pass corrected, or says that the search found none."],
      ["skills/implement/fix-pass.md", "The search is the `git grep` on the fact's words that `agents/crafter.md` *Before you hand back, your range and the work item's records are read whole against HEAD* asks for, and the `answer:` calls it a sample."],
    ] as const)
      expect(flat(file), `${file}: ${said}`).toContain(said);
  });

  it("leaves the rules to a role's rules file: no definition's frontmatter holds a skills key", () => {
    for (const { role } of ROLE_STAGES) {
      const frontmatter = frontmatterOf(read(`agents/${role}.md`));
      expect(frontmatter, role).not.toBe("");
      expect(frontmatter, role).not.toMatch(/^skills:/m);
    }
  });

  it("holds the orchestrator's definition for its two judgments: the signals that say the rounds are not converging, none of the first four held by a finding located in the work item's records alone, what a no buys for the stop it costs, how a question is decided from the code and the policy, what alone parks a work item, and the blocks of its answer by the keys the daemon reads", () => {
    const definition = read("agents/orchestrator.md");
    for (const named of [
      "whether the review rounds are converging",
      "a ruling on each\nquestion a stage asked",
      "These signals say the rounds are not\nconverging",
      "`reopens:`",
      "`regression:`",
      "**A question is first decided from the code and the policy.**",
      "**Only what a person alone can give parks a work item.**",
      "`decided:`",
      "`grounds:`",
      "You write no file and run no command",
    ]) expect(definition, named).toContain(named);
    // A finding located in the work item's records alone holds none of the first four signals, and a `no` argues for the stop it costs (issue #236).
    const flat = definition.replace(/\s+/gu, " ");
    for (const said of [
      "**A finding located in the work item's records alone counts toward none of the first four signals.**",
      "A finding is located in the records where every path its `location:` lines name stands in the work item's directory.",
      "Such a finding holds no signal by its `reopens:` line or its `regression:` line, is counted neither among the last round's open findings nor among those of the round before it, and is not one of two findings at one location or on one rule of the frame two rounds in a row.",
      "So the third signal compares the findings of the two rounds that are located outside the records.",
      "Where the last round has no open finding located outside the records, the third signal does not hold.",
      "The last signal, a finding closed `rejected` and raised again, holds for every finding, wherever it is located.",
      "A finding in the records corrects text of the records, and the fix pass that closes it reads the work item's records whole and corrects the fact at every place that states it (`skills/implement/fix-pass.md` *The narrow set, then the read of the range*).",
      "The owl chain's ceiling of rounds bounds such findings as well, where the daemon runs the chain and in a pane.",
      "A stop is the most expensive step of the chain, as `skills/core/SKILL.md` *Asking a person is the most expensive step* says: it costs the person's attention, and while nobody watches it costs the hours until somebody does.",
      "So a `no` argues for its stop by what it buys: the person's decision at the stop, which no fix pass makes, such as a reframe, a split of the work, dropping the work or a fix by hand, and the rounds that a chain which does not converge would spend before anything else stops it.",
      "The `grounds:` line of a `no` names the signal that holds and the findings that hold it.",
      "A reopen or a regression located in the work item's records alone buys no such decision, since the person's next start would only run the same fix pass.",
      "That is why such a finding counts toward none of the first four signals above, and the chain goes on.",
    ]) expect(flat, said).toContain(said);
    for (const ruling of ["answered", "default", "scope", "park"]) expect(definition, ruling).toContain(`- \`${ruling}\`: `);
    // The words of a ruling are the ones the daemon's reader takes.
    expect(RULING_BLOCK.keys.get("rules:")?.shape.source).toContain("default|scope|answered|park");
    // The README no longer says that the bundle holds no definition of the orchestrator.
    expect(read("README.md")).toContain("The bundle holds the orchestrator's definition, `agents/orchestrator.md`, for the two judgments the daemon asks of its orchestrator agent and a pane's session makes itself");
  });

  it("has the sealer queue and draw no stamp", () => {
    expect(read("agents/sealer.md")).not.toMatch(/stamp/i);
  });

  it("names no command and no script in the sealer's definition, the guarantee's form and its template, and no check line of a test this repository does not hold", () => {
    for (const file of ["agents/sealer.md", "docs/forms/the-guarantee.md", "templates/records/sdd-guarantee.md"]) {
      const text = read(file);
      // A command is a span of code that opens with a program's name: AgenticSeal's CLI, git, GitHub's CLI or an interpreter.
      expect(text.match(/`(?:seal|git|gh|python3?|uv|pnpm|node) [^`]*`/gu), file).toBeNull();
      for (const named of ["seal gate", "seal pr-body", "broad_gate", "chain_check", "Claims re-run", "lib/fields.py", ".py", "scripts/", "check: tests/", "original:"]) expect(text, `${file} names ${named}`).not.toContain(named);
    }
  });

  it("describes the check's body arm and the pull request's body as Owlery holds them, with no composer of a body that pr-check/ no longer holds", () => {
    for (const file of ["skills/core/SKILL.md", "skills/implement/SKILL.md", "docs/forms/the-round-record.md"]) expect(read(file), file).not.toContain("seal pr-body");
    expect(read("skills/core/SKILL.md")).toContain("its body arm: a ready pull request fails where its body's seal section, which Owlery composes, holds a verdict block other than the newest of the work item's `guarantee.md` at HEAD");
    expect(read("skills/implement/SKILL.md")).toContain("| `pr.md` | no template | nobody: Owlery writes no `pr.md`");
    // A round reads a pr.md where one stands, and reads no file nobody writes.
    expect(read("agents/proofer.md").replace(/\s+/gu, " ")).toContain("`changelog.md`, and, where one stands, `pr.md` and `pr.<lang>.md`, each whole at the target");
  });

  it("shapes a run's section as Owlery takes one: the template opens with the run's heading, its one seal block holds target: and Verdict: alone, and Owlery's reader takes the template filled in", () => {
    const template = read("templates/records/sdd-guarantee.md");
    expect(template.split("\n")[0]).toBe("## Run <N>");
    const blocks = [...template.matchAll(/^```seal\n([\s\S]*?)^```$/gmu)].map(([, lines = ""]) => lines.trim().split("\n").map((line) => line.slice(0, line.indexOf(":") + 1)));
    expect(blocks).toEqual([["target:", "Verdict:"]]);
    expect([...template.matchAll(/^### .*$/gmu)].map(([heading]) => heading)).toEqual(["### Claims checked by reading", "### The parties"]);
    const target = `${"a".repeat(40)} against main`;
    const filled = template.replace("<N>", "3").replace(/^target: .*$/mu, `target: ${target}`).replace(/^Verdict: .*$/mu, "Verdict: withheld reason: the changelog names `gone.ts`, which the tree does not hold");
    expect(sectionOf(`I read the branch.\n\n${filled}`, { run: 3, target })).toBe(filled);
  });

  it("tells the sealer what the owl chain does: it works on the commit the gate passed on, runs no command and writes no file, answers with its run's section, checks each kind of claim by reading, leaves the gate to Owlery, and asks the person through an undecided verdict", () => {
    // Read with each run of white space as one space, so a sentence is found however its lines are wrapped.
    const definition = read("agents/sealer.md").replace(/\s+/gu, " ");
    for (const named of [
      "You write no file and run no command that asks for permission: your answer is your run's section of `guarantee.md`",
      "the commit you audit is the one your prompt's target line names: the commit the broad gate passed on",
      "The work item names no issue",
      "You check each claim by reading",
      "Each finding a round's record closes `fixed <commit>`",
      "Each decision of `decisions.md` that stands `decided` or `applied`",
      "each `## Removes` row of `frame/design.md`",
      "Each phase record: what it says the phase built stands in the tree",
      "**The parties against each other.**",
      "Its first line is the heading your prompt gives, `## Run <N>`",
      "It holds no other line: Owlery adds who built the work, who judged it, the judging model and its own version",
      "**A question for the person is the verdict `undecided`, with the question.**",
      "**Owlery holds that the gate passed on the audited commit.**",
      "The chain stops with that line. What it names is fixed and nothing else, and the chain is started again on the fixed head.",
      "**The session that judges built none of the work.**",
    ]) expect(definition, named).toContain(named);
    const form = read("docs/forms/the-guarantee.md").replace(/\s+/gu, " ");
    for (const named of [
      "`### Claims checked by reading` or `### The parties`",
      "Owlery writes four lines more into the block, before its closing fence: `built-by:`",
      "A `withheld` verdict stops it with the reason. What the reason names is fixed, and the chain is started again on the fixed head, in the pane's session or by Owlery's daemon.",
      "the closing records follow",
      "The closing records are `trail/gate.md`, `guarantee.md` and `trail/refusals.md`",
    ]) expect(form, named).toContain(named);
    for (const gone of ["pull request body", "seal mark", "the orchestrator's broad run"]) expect(form, gone).not.toContain(gone);
    expect(read("README.md")).toContain("a sealer reads the commit Owlery's run of the broad gate passed on and answers with its run's section of the guarantee, which Owlery completes with who built the work and who judged it, writes and commits");
  });

  it("tells the sealer how a run that follows a broken seal judges: its prompt hands it what changed since that seal's commit, it reads the earlier run's section as that run's claim, checks the records written since and the changed part against the tree, names the run it stands on, and still judges the whole branch against its base", () => {
    // Read with each run of white space as one space, so a sentence is found however its lines are wrapped.
    const flat = (path: string): string => read(path).replace(/\s+/gu, " ");
    const definition = flat("agents/sealer.md");
    for (const named of [
      "the paths the branch changed, and their diff. Where your prompt names the seal this run follows, they are what changed since that seal's commit, and otherwise what changed since the branch left its base.",
      "**A run that follows a broken seal is handed the part that changed.**",
      "Read the earlier run's section as that run's claim, and check against the tree the claims of the records written after that seal and the part that changed.",
      "Then name in a row of your section's first table the run you stand on for the rest.",
      "Your verdict is still a verdict on the whole branch against its base, and its target line is your prompt's.",
    ]) expect(definition, named).toContain(named);
    expect(definition).not.toContain("the paths the branch changed since it left its base, and their diff");
    expect(flat("docs/forms/the-guarantee.md")).toContain("Where a later commit broke an earlier seal, the sealer's prompt hands it the part that changed since that seal's commit, it stands on the earlier run's section for the rest, and its verdict still covers the whole branch against its base.");
  });

  it("holds no script, no library and no drawing: every file under the four taken folders is a document, and the files beside them are the manifest, the licence, the notice and the one file of the hook", () => {
    const taken = filesOf(BUNDLE).filter((file) => /^(agents|skills|docs|templates)\//.test(file));
    expect(taken.filter((file) => !file.endsWith(".md"))).toEqual([]);
    expect(filesOf(BUNDLE).filter((file) => !taken.includes(file))).toEqual([".claude-plugin/plugin.json", "LICENSE", "README.md", "hooks/hooks.json"]);
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
    // A file the tree's bundle holds no more: a build replaces the folder whole, so a session never loads it.
    mkdirSync(join(built, "hooks"), { recursive: true });
    writeFileSync(join(built, "hooks", "session-start.json"), "{}\n");
    buildApp();
    const files = filesOf(BUNDLE);
    expect(filesOf(built)).toEqual(files);
    for (const file of files) expect(readFileSync(join(built, file)).equals(readFileSync(join(BUNDLE, file))), file).toBe(true);
  });

  /** A script of the case's own, in the temporary repository's folder. */
  const script = (made: { base: string }, name: string, body: string): string => {
    const file = join(made.base, name);
    writeFileSync(file, `#!/bin/sh\n${body}\n`);
    chmodSync(file, 0o755);
    return file;
  };

  /** Starts the built daemon with a run folder of the case's own, into which `writeRun` writes before the start where it is given, and `shell` as the person's shell, and gives the run folder, a way to send it a message, and a wait for one of its messages. */
  async function builtDaemon(made: { base: string; root: string }, shell: string, writeRun?: (runDir: string) => void) {
    const runDir = realpathSync(mkdtempSync(join(tmpdir(), "owlery-role-run-")));
    cleanups.push(() => rmSync(runDir, { recursive: true, force: true }));
    writeRun?.(runDir);
    const daemon = spawn(process.execPath, [join(APP_DIR, "dist", "daemon.js")], {
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
    return { runDir, message, send: (sent: object) => socket.send(JSON.stringify(sent)) };
  }

  it("is what the built daemon launches a role with: the bundle beside its script, and a rules file it writes into its run folder", async () => {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    // A repository with a place for work records, and a work item stored parked on one question, whose answer has the daemon resume its chain at round 1, the proofer's.
    for (const [path, text] of [
      ["seal/README.md", `${MARKER}\n`],
      ["seal/config.json", '{ "Broad gate": "true" }\n'],
    ] as const) {
      mkdirSync(dirname(join(made.repo, path)), { recursive: true });
      writeFileSync(join(made.repo, path), text);
    }
    git(made.repo, "add", "--all");
    git(made.repo, "commit", "--quiet", "-m", "chore: the records place");
    const { stored, questionId } = await parkedOnAQuestion({ repo: made.repo, root: made.root, id: 1, title: "Reviewed", workItem: "1795396360-reviewed", asks: "Which base does the work merge into?", at: Date.now() - 60_000 });
    const repository = { id: 1, folder: made.repo, name: null, icon: null, defaultBase: null, hidden: false, addedAt: Date.now() - 60_000, groups: [], workItems: [stored] };
    // Stands for the CLI: records a session's arguments, then prints the first line of a session that holds the bundle's agents, and a result.
    // The daemon also runs it at its start, to read its version, and that run records nothing.
    const cli = script(
      made,
      "cli",
      [
        `if [ "$*" = "--version" ]; then echo '2.1.330 (Claude Code)'; exit 0; fi`,
        `for a in "$@"; do printf '%s\\n' "$a"; done > '${made.base}/args'`,
        `echo '{"type":"system","subtype":"init","agents":["claude","owlery:crafter","owlery:proofer","owlery:sealer"]}'`,
        `echo '{"type":"result","is_error":false,"result":"read","total_cost_usd":0}'`,
        // It exits at the end of its input, which the daemon ends once the result has arrived.
        "cat > /dev/null",
      ].join("\n"),
    );
    // Stands for the login shell: it names the CLI and ends.
    const shell = script(made, "shell", `printf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n__owlery_config=%s\\n' '${cli}' '/usr/bin:/bin' "\${CLAUDE_CONFIG_DIR:-}"`);
    const { runDir, message, send } = await builtDaemon(made, shell, (runDir) => writeFileSync(join(runDir, "repositories.json"), JSON.stringify({ nextWorkItemId: 2, nextRepositoryId: 2, nextGroupId: 1, repositories: [repository] })));
    send({ type: "answerQuestions", requestId: 1, workItemId: stored.id, answers: [{ questionId, answer: "main" }] });
    const role = { role: "proofer", stage: "round" } as const;
    const { headless } = await message("headless", (m) => m.headless.state === "finished" || m.headless.state === "failed");
    expect([headless.state, headless.answer, headless.error, headless.role]).toEqual(["finished", "read", null, role]);

    const bundleDir = join(APP_DIR, "dist", "bundle");
    const rulesFile = join(runDir, "roles", "proofer-round.md");
    expect(readFileSync(join(made.base, "args"), "utf8").split("\n").slice(0, -1)).toEqual(claudeArgs(stored.worktree, { bundleDir, agent: "owlery:proofer", rulesFile, tools: ["Read", "Glob", "Grep", "Bash"] }));
    // The rules of the launch are the built bundle's documents, which the case above holds equal to the tree's.
    expect(readFileSync(rulesFile, "utf8")).toBe(rulesText(bundleDir, role));
    expect(readFileSync(rulesFile, "utf8")).toContain("the retired numbers are 8, 16 and 20");
  }, 30_000);

  it("is what the built daemon launches a Claude Code pane on the owl chain with: the bundle beside its script, the head it writes into its run folder, and a launcher there that runs the built chain command in the pane's own environment", async () => {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    // A repository on the owl chain, with a place for work records.
    for (const [path, text] of [
      [".github/workflows/owlery-seal.yml", "name: seal\n"],
      ["seal/README.md", `${MARKER}\n`],
      ["seal/config.json", '{ "Mode": "shared", "Broad gate": "true" }\n'],
    ] as const) {
      mkdirSync(dirname(join(made.repo, path)), { recursive: true });
      writeFileSync(join(made.repo, path), text);
    }
    git(made.repo, "add", "--all");
    git(made.repo, "commit", "--quiet", "-m", "chore: the check and the records place");
    // The branch the work item checks out, so the chain command finds one at the pane's start: a work item with no branch yet has none until its first commit.
    git(made.repo, "branch", "--quiet", "carried");
    // Stands for the login shell and for the pane's shell. Asked for a Claude Code pane's command, and for no other the daemon runs through a shell, it runs no `claude`: it asks the chain command its environment names for the step owed, as a pane's session would, and writes the answer after the command it was given.
    const out = join(made.base, "pane.txt");
    const shell = script(
      made,
      "shell",
      [
        `if [ "$3" = -c ] && [ "\${4#exec claude }" != "$4" ]; then { printf '%s\\n' "$4"; printf 'chain=%s base=%s node=%s\\n' "$OWLERY_CHAIN" "$OWLERY_BASE" "\${ELECTRON_RUN_AS_NODE-unset}"; "$OWLERY_CHAIN" owed; printf 'exit=%s\\n' "$?"; } > '${out}.partial' 2>&1; mv '${out}.partial' '${out}'; exit 0; fi`,
        `printf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n__owlery_config=%s\\n' '/usr/bin/false' '/usr/bin:/bin' "\${CLAUDE_CONFIG_DIR:-}"`,
      ].join("\n"),
    );
    const { runDir, message, send } = await builtDaemon(made, shell);
    send({ type: "createWorkItem", requestId: 1, repo: made.repo, title: "Carried", branch: "carried", kind: "claude", cols: 80, rows: 24 });
    await message("workItemCreated");
    const end = Date.now() + 10_000;
    while (!existsSync(out) && Date.now() < end) await new Promise((r) => setTimeout(r, 50));

    const built = join(APP_DIR, "dist");
    const launcher = join(runDir, "owl-chain");
    expect(readFileSync(out, "utf8").split("\n")).toEqual([
      `exec claude --settings '${join(runDir, "claude-hooks.json")}' --plugin-dir '${join(built, "bundle")}' --append-system-prompt-file '${join(runDir, "pane-head.md")}'`,
      // The pane's environment holds nothing that makes Electron run as Node, and the launcher gives it to the command's process alone.
      `chain=${launcher} base=main node=unset`,
      // No directory of the records names the branch yet, so the built command, run by Electron's Node, owes the start.
      '{"step":"start"}',
      "exit=0",
      "",
    ]);
    expect(readFileSync(join(runDir, "pane-head.md"), "utf8")).toBe(paneHead());
    expect(readFileSync(launcher, "utf8")).toContain(` '${join(built, "chain.js")}' "$@"`);
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
    const shell = script("shell", `printf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n__owlery_config=%s\\n' '${cli}' '/usr/bin:/bin' "\${CLAUDE_CONFIG_DIR:-}"`);
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
