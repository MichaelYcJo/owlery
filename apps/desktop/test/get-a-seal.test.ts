// "Get a seal" at the foot of a work item's view in the built app. It starts
// the app once, in the background, on a temporary repository that holds the
// place for work records. The login shell is a script that names a script
// CLI, so no real `claude` runs: the stand-in writes its process id and
// sleeps, so the round it is launched for runs until a second client of the
// daemon stops its session. Once the file `answers` stands beside it, the
// stand-in answers a round's prompt with a record that holds no finding, so
// the chain goes on to the repository's broad gate, a command that fails
// and, while the file `gate-holds` stands, sleeps first. While the file
// `gate-passes` stands the command exits with 0, and the stand-in answers
// the sealer's prompt with a verdict of `sealed`. The login shell's PATH
// leads with the stand-in for `gh` (fixtures/sample-gh/gh), so the daemon
// then pushes the branch to a bare repository in the case's temporary
// folder and opens the pull request through the stand-in, and nothing
// reaches GitHub. The app is started with `OWLERY_OPENER` naming a script
// that notes each address it is handed, so no browser opens. The page's
// `Notification` is replaced by a recorder, so nothing reaches the system's
// notifications.
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MARKER } from "../src/daemon/records-place";
import type { ClientMessage, ServerMessage, WorkItem } from "../src/shared/protocol";
import { alive, BuiltApp, buildApp, untilGone } from "./built-app";
import { commitFile, git, temporaryRepository } from "./repositories";

/** The line the repository's broad gate prints before it fails. */
const PRINTED = "FAIL test/view.test.ts: 1 case failed";

/** The repository's broad gate command: it exits with 0 while the file `gate-passes` stands in the folder, and otherwise sleeps while the file `gate-holds` stands, then prints a line and exits with 1. */
const GATE = (base: string): string => `if [ -e '${join(base, "gate-passes")}' ]; then exit 0; fi; if [ -e '${join(base, "gate-holds")}' ]; then sleep 30; fi; echo '${PRINTED}'; exit 1`;

/** The folder of the stand-in for `gh` (fixtures/sample-gh/gh), which the login shell's PATH names first: it reaches no GitHub, opens pull request #12 and answers it open with two checks that passed. */
const GH_FOLDER = join(__dirname, "fixtures", "sample-gh");

describe('"Get a seal" in the built app', { timeout: 60_000 }, () => {
  let app: BuiltApp;
  let made: ReturnType<typeof temporaryRepository>;

  function script(name: string, body: string): string {
    const path = join(made.base, name);
    writeFileSync(path, `#!/bin/sh\n${body}\n`);
    chmodSync(path, 0o755);
    return path;
  }

  /** The foot of the view, as a person reads it: the button, the chain's sentence above it and the refusal under it. */
  const foot = (): Promise<{ button: string; hidden: boolean; disabled: boolean; says: string; refusal: string }> =>
    app.evaluate(`(() => { const b = document.getElementById("get-seal"); return { button: b.textContent, hidden: b.hidden, disabled: b.disabled, says: document.getElementById("seal-says").textContent, refusal: document.getElementById("seal-refusal").textContent }; })()`);

  /** A second client of the daemon: the work item Alpha as the daemon last listed it, and a message it sends. */
  async function client(): Promise<{ alpha(): WorkItem; send(message: ClientMessage): void; close(): void }> {
    const { port, token } = JSON.parse(readFileSync(join(app.userData, "run", "daemon.json"), "utf8")) as { port: number; token: string };
    const socket = new WebSocket(`ws://127.0.0.1:${port}`);
    const messages: ServerMessage[] = [];
    await new Promise<void>((resolve) => {
      socket.addEventListener("open", () => socket.send(JSON.stringify({ type: "hello", token })));
      socket.addEventListener("message", (event) => {
        const message = JSON.parse(String(event.data)) as ServerMessage;
        messages.push(message);
        if (message.type === "ready") resolve();
      });
    });
    return {
      alpha: () => messages.flatMap((m) => (m.type === "ready" || m.type === "inbox" ? m.workItems : [])).filter((item) => item.title === "Alpha").at(-1)!,
      send: (message) => socket.send(JSON.stringify(message)),
      close: () => socket.close(),
    };
  }

  beforeAll(async () => {
    buildApp();
    made = temporaryRepository();
    // The place for work records stands on the branch the work item is cut from.
    mkdirSync(join(made.repo, "seal"));
    writeFileSync(join(made.repo, "seal", "README.md"), `${MARKER}\n\nOwlery keeps the work records of this repository here.\n`);
    // A chain starts only where the records name a broad gate command. The command prints a line and exits with 1, after a sleep while the file `gate-holds` stands.
    writeFileSync(join(made.repo, "seal", "config.json"), `${JSON.stringify({ "Broad gate": GATE(made.base) })}\n`);
    git(made.repo, "add", "--all");
    git(made.repo, "commit", "--quiet", "-m", "chore: add the place for work records");
    // The daemon also runs the CLI at its start, to read its version: that run prints one and is no session.
    // Without the file `answers` a session sleeps. With it, the stand-in reads the handshake and the prompt and names its session and its role's agent as the CLI's first line does. It answers a sealer's prompt with a run's section whose verdict is `sealed`, under the heading and over the target line the prompt gave, and every other prompt with the round's record: the heading and the target line the prompt gave, and no finding.
    const cli = script(
      "cli",
      [
        `if [ "$*" = "--version" ]; then echo '2.1.330 (Claude Code)'; exit 0; fi`,
        `if [ ! -e '${join(made.base, "answers")}' ]; then echo $$ > '${join(made.base, "cli-pid")}'; exec sleep 60; fi`,
        "read -r handshake",
        "read -r prompt",
        `case "$prompt" in *'of the sealer on the work item'*)`,
        "  heading=$(printf '%s' \"$prompt\" | sed -n 's/.*- Your section.s heading: `\\([^`]*\\)`.*/\\1/p')",
        "  target=$(printf '%s' \"$prompt\" | sed -n 's/.*- Your verdict.s target line: `\\([^`]*\\)`.*/\\1/p')",
        `  printf '%s\\n' '{"type":"system","subtype":"init","session_id":"stand-in-2","model":"stand-in","agents":["owlery:sealer"]}'`,
        `  printf '{"type":"result","result":"%s\\\\n\\\\n### Claims checked by reading\\\\n\\\\n| Claim | Source | Read at | Result |\\\\n|---|---|---|---|\\\\n| Round 1 left no finding | \`trail/rounds/round-1.md\` | \`feature.txt\` | holds |\\\\n\\\\n\`\`\`seal\\\\n%s\\\\nVerdict: sealed\\\\n\`\`\`\\\\n","is_error":false}\\n' "$heading" "$target"`,
        "  exit 0;;",
        "esac",
        "heading=$(printf '%s' \"$prompt\" | sed -n 's/.*- Your record.s heading: `\\([^`]*\\)`.*/\\1/p')",
        "target=$(printf '%s' \"$prompt\" | sed -n 's/.*- Your record.s target line: `target: \\([^`]*\\)`.*/\\1/p')",
        `printf '%s\\n' '{"type":"system","subtype":"init","session_id":"stand-in-1","model":"stand-in","agents":["owlery:proofer"]}'`,
        `printf '{"type":"result","result":"%s\\\\n\\\\n\`\`\`seal\\\\ntarget: %s\\\\n\`\`\`\\\\n\\\\n## Findings\\\\n","is_error":false}\\n' "$heading" "$target"`,
      ].join("\n"),
    );
    // The login shell: it names the stand-in and a PATH whose first folder holds the stand-in for `gh`, and a pane it starts ends at once.
    const shell = script("shell", `printf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n' '${cli}' '${GH_FOLDER}:/usr/bin:/bin'`);
    // The program that stands for the system's browser: it notes each address it is handed.
    const opener = script("opener", `printf '%s\\n' "$1" >> '${join(made.base, "opened")}'`);
    app = await BuiltApp.start({ SHELL: shell, OWLERY_WORKTREES: made.root, OWLERY_OPENER: opener });
    // The recorder stands before any chain starts, so no notification of this run reaches the system.
    await app.evaluate(`(() => {
      window.__notifications = [];
      window.Notification = class {
        static permission = "granted";
        constructor(title, options) {
          this.title = title;
          this.body = options?.body;
          this.onclick = null;
          window.__notifications.push(this);
        }
      };
    })()`);
    await app.until(`["summary-screen", "inbox-screen", "history-screen"].some((id) => document.getElementById(id)?.hidden === false)`, "a screen in front");
    await app.click("#new-work-item");
    await app.until(`document.getElementById("work-item-dialog").open`, 'the "New work item" form');
    await app.evaluate(`document.getElementById("work-item-repo").select()`);
    await app.cdp("Input.insertText", { text: made.repo });
    await app.click("#work-item-title");
    await app.cdp("Input.insertText", { text: "Alpha" });
    await app.evaluate(`document.getElementById("work-item-kind").value = "shell"`);
    // Create creates nothing before the form shows the plan of its folder.
    await app.until(`document.getElementById("work-item-branch").textContent !== ""`, "the plan of the folder");
    await app.click("#work-item-create");
    await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === "Alpha"`, "the view of Alpha");
  }, 120_000);

  afterAll(async () => {
    await app?.stop();
    made?.remove();
  }, 30_000);

  it("shows the daemon's refusal under the button, is disabled with the chain's sentence above it while the round runs, lists the round's session with its stop control, and once the round's session is stopped notifies of the chain, gives the line the state waiting and the chain's sentence in its second row, and has the button on again, as it is after a second press whose round is stopped with the view in front", async () => {
    const start = "Start the review rounds on Alpha";
    expect(await foot()).toEqual({ button: "Get a seal", hidden: false, disabled: false, says: "", refusal: "" });
    expect(await app.evaluate(`[document.getElementById("get-seal").title, document.getElementById("get-seal").classList.contains("primary"), document.getElementById("view-seal").contains(document.getElementById("get-seal"))]`)).toEqual([start, true, true]);

    // The branch holds no commit yet, so the daemon refuses the start, and the button can be pressed again.
    const nothing = "The branch holds no commit after its base, so a round has nothing to read.";
    await app.click("#get-seal");
    await app.until(`document.getElementById("seal-refusal").textContent !== ""`, "the refusal under the button");
    expect(await foot()).toEqual({ button: "Get a seal", hidden: false, disabled: false, says: "", refusal: nothing });

    const second = await client();
    try {
      const workItem = second.alpha();
      commitFile(workItem.worktree, "feature.txt");
      await app.click("#get-seal");
      const running = "Review round 1 is running.";
      await app.until(`document.getElementById("seal-says").textContent === ${JSON.stringify(running)}`, "the sentence of the running round", 20_000);
      expect(await foot()).toEqual({ button: "Get a seal", hidden: false, disabled: true, says: running, refusal: "" });
      expect(await app.evaluate(`document.getElementById("get-seal").title`)).toBe("The chain is running.");

      // The round's session stands in the "Ask" section as every headless session does, with "Stop".
      await app.until(`document.querySelector("#headless li .state.working")`, "the round's session as working");
      expect(await app.evaluate(`[...document.querySelectorAll("#headless li")].map((li) => [...li.querySelectorAll("button")].map((b) => b.textContent))`)).toEqual([["Stop"]]);
      const pidFile = join(made.base, "cli-pid");
      const deadline = Date.now() + 10_000;
      while (!existsSync(pidFile) && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50));
      const pid = Number(readFileSync(pidFile, "utf8").trim());
      expect(alive(pid)).toBe(true);

      // While the round runs the line is among those at work, and nothing was notified.
      const line = `#inbox-lines button[data-work-item="${workItem.id}"]`;
      await app.click("#nav-inbox");
      await app.until(`!document.getElementById("inbox-screen").hidden && document.querySelector('${line}')`, "the inbox screen");
      expect(await app.evaluate(`document.querySelector('${line} .state-icon').classList.contains("working")`)).toBe(true);
      expect(await app.evaluate(`window.__notifications.length`)).toBe(0);

      // The session is stopped while the inbox is in front, so the person is not looking at the work item.
      const stage = second.alpha().chain?.stages.at(-1);
      expect([stage?.kind, stage?.round, stage?.state]).toEqual(["round", 1, "working"]);
      second.send({ type: "stopHeadless", requestId: 1, id: stage!.headlessId! });
      const stopped = "Review round 1 failed: the session was stopped at a request before it finished.";
      await app.until(`document.querySelector('${line} .says')?.textContent === ${JSON.stringify(stopped)}`, "the chain's sentence in the line's second row", 20_000);
      expect(await app.evaluate(`document.querySelector('${line} .state-icon').classList.contains("waiting")`)).toBe(true);
      expect(await untilGone([pid], 5_000)).toEqual([]);
      // The chain that stopped raised what a work item that begins to wait raises, and a click on it opens the work item's view.
      expect(await app.evaluate(`window.__notifications.map(({ title, body }) => ({ title, body }))`)).toEqual([{ title: "Alpha", body: "Needs you" }]);
      await app.evaluate(`window.__notifications[0].onclick()`);
      await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === "Alpha"`, "the view of Alpha at the click");
      expect(await foot()).toEqual({ button: "Get a seal", hidden: false, disabled: false, says: stopped, refusal: "" });
      expect(await app.evaluate(`document.getElementById("get-seal").title`)).toBe(start);

      // A second press runs the same round again. Its session is stopped with the view in front, and the button is on again there.
      await app.click("#get-seal");
      await app.until(`document.getElementById("seal-says").textContent === ${JSON.stringify(running)}`, "the sentence of the round that runs again", 20_000);
      expect((await foot()).disabled).toBe(true);
      const again = Date.now() + 10_000;
      while (second.alpha().chain?.stages.at(-1)?.state !== "working" && Date.now() < again) await new Promise((r) => setTimeout(r, 50));
      const rerun = second.alpha().chain?.stages ?? [];
      expect(rerun.map(({ kind, round, state }) => [kind, round, state])).toEqual([["round", 1, "failed"], ["round", 1, "working"]]);
      second.send({ type: "stopHeadless", requestId: 2, id: rerun.at(-1)!.headlessId! });
      await app.until(`document.getElementById("seal-says").textContent === ${JSON.stringify(stopped)}`, "the sentence of the chain that stopped again", 20_000);
      expect(await foot()).toEqual({ button: "Get a seal", hidden: false, disabled: false, says: stopped, refusal: "" });
      // No record of the round was committed: the branch holds the person's commit and the routing the first start declared.
      expect(git(workItem.worktree, "log", "--format=%s", `${workItem.baseCommit ?? ""}..HEAD`).trim().split("\n")).toEqual(["chore: declare the work item's routing", "add feature.txt"]);
    } finally {
      second.close();
    }
  });

  it('lists the broad gate first under "Ask" once the round leaves nothing open: at work with its command and "Stop", which ends the command, and after a run that failed with the failed mark, the reason and "Show output", which draws what the command printed under the line, while the sealer\'s place waits with "Gate failed" and the work item\'s line waits with the chain\'s sentence in its second row', async () => {
    /** The gate's line as a person reads it: its command, its state's class and word, what its icon says, the reason under it, its buttons and what stands under it of the command's output. */
    const gateLine = (): Promise<{ first: boolean; head: string; command: string; state: string; icon: string; says: string; buttons: string[]; printed: string | null } | null> =>
      app.evaluate(`(() => {
        const li = document.querySelector("#headless li.gate");
        if (!li) return null;
        const state = li.querySelector(".row > .state:not(.state-icon)");
        return {
          first: li === document.querySelector("#headless li"),
          head: li.querySelector(".prompt").textContent,
          command: li.querySelector(".prompt .command").textContent,
          state: [...state.classList].filter((name) => name !== "state").join(" ") + ":" + state.textContent,
          icon: li.querySelector(".state-icon").getAttribute("aria-label"),
          says: li.querySelector(".answer").textContent,
          buttons: [...li.querySelectorAll("button")].map((b) => b.textContent),
          printed: li.querySelector(".error-output")?.textContent ?? null,
        };
      })()`);
    /** The sealer's place of the approval line in the view's right column: its mark's class, its note, and the lines under the places. */
    const sealer = (): Promise<{ waiting: boolean; note: string; under: string[] }> =>
      app.evaluate(`(() => { const place = document.querySelector('#view-detail section.approval .place[data-role="sealer"]'); return { waiting: place.querySelector(".state-icon").classList.contains("waiting"), note: place.querySelector(".note").textContent, under: [...document.querySelectorAll("#view-detail section.approval .under")].map((line) => line.textContent) }; })()`);
    const command = GATE(made.base);
    const second = await client();
    try {
      const workItem = second.alpha();
      // The view of Alpha in front, whatever screen the case before left there.
      await app.click(`#repositories button[data-work-item="${workItem.id}"]`);
      await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === "Alpha"`, "the view of Alpha");
      if (git(workItem.worktree, "rev-list", "--count", `${workItem.baseCommit ?? ""}..HEAD`).trim() === "0") commitFile(workItem.worktree, "feature.txt");
      // From here the stand-in answers a round with no finding, and the gate's command sleeps before it fails.
      writeFileSync(join(made.base, "answers"), "");
      writeFileSync(join(made.base, "gate-holds"), "");
      await app.click("#get-seal");
      await app.until(`document.querySelector("#headless li.gate .state.working")`, "the broad gate's line at work", 30_000);
      expect(await gateLine()).toEqual({ first: true, head: `Broad gate ${command}`, command, state: "working:working", icon: "working", says: "", buttons: ["Stop"], printed: null });
      expect((await foot()).says).toBe("The broad gate is running.");

      // "Stop" ends the command: the gate failed, nothing it printed is kept, and the chain stopped.
      await app.click(`#headless li.gate button[data-answer="gate:stop"]`);
      const stopped = "The broad gate failed: the command was stopped at a request before it ended.";
      await app.until(`document.getElementById("seal-says").textContent === ${JSON.stringify(stopped)}`, "the sentence of the gate that was stopped", 20_000);
      expect(await gateLine()).toEqual({ first: true, head: `Broad gate ${command}`, command, state: "failed:failed", icon: "failed", says: "The command was stopped at a request before it ended.", buttons: [], printed: null });

      // A second press runs the gate again and no round, and the command now prints its line and exits with 1.
      rmSync(join(made.base, "gate-holds"));
      await app.click("#get-seal");
      const failed = "The broad gate failed: the command exited with code 1.";
      await app.until(`document.getElementById("seal-says").textContent === ${JSON.stringify(failed)}`, "the sentence of the gate that failed", 20_000);
      expect(await gateLine()).toEqual({ first: true, head: `Broad gate ${command}`, command, state: "failed:failed", icon: "failed", says: "The command exited with code 1.", buttons: ["Show output"], printed: null });
      expect(second.alpha().chain?.stages.map(({ kind, state }) => [kind, state]).slice(-3)).toEqual([["round", "finished"], ["gate", "failed"], ["gate", "failed"]]);
      // A gate that failed is no failure of the sealer: its place waits, and the gate's reason stands under the places.
      expect(await sealer()).toEqual({ waiting: true, note: "Gate failed", under: ["Sealer: The command exited with code 1."] });

      // "Show output" draws what the command printed under the line, and the line stays as it was.
      await app.click(`#headless li.gate button[data-answer="gate:output"]`);
      await app.until(`document.querySelector("#headless li.gate .error-output")`, "what the command printed, under the gate's line");
      expect(await gateLine()).toEqual({ first: true, head: `Broad gate ${command}`, command, state: "failed:failed", icon: "failed", says: "The command exited with code 1.", buttons: ["Show output"], printed: `${PRINTED}\n` });
      expect(await app.evaluate(`document.querySelector("#headless li.gate .output-note")`)).toBeNull();

      // The work item's line waits, with the chain's sentence in its second row.
      const line = `#inbox-lines button[data-work-item="${workItem.id}"]`;
      await app.click("#nav-inbox");
      await app.until(`!document.getElementById("inbox-screen").hidden && document.querySelector('${line} .says')?.textContent === ${JSON.stringify(failed)}`, "the chain's sentence in the line's second row");
      expect(await app.evaluate(`document.querySelector('${line} .state-icon').classList.contains("waiting")`)).toBe(true);
      // The round's record is committed, and no run of the gate is.
      expect(git(workItem.worktree, "log", "--format=%s", "-1").trim()).toBe("chore: record review round 1");
      expect(existsSync(join(workItem.worktree, "seal", "threads", git(workItem.worktree, "ls-tree", "--name-only", "HEAD", "seal/threads/").trim().split("/").at(-1) ?? "", "trail", "gate.md"))).toBe(false);
    } finally {
      second.close();
    }
  });

  it("once the gate passes and the sealer seals, pushes the branch, opens the pull request through the stand-in for gh, lists its number, its state and each check under the seal's place, each opening its address, and gives the line the state and the second row of a pull request whose checks passed", async () => {
    /** The pull request under the seal's place, as a person reads it: its row, the result of its checks, each check's mark, name and word, and what stands under the rows. */
    const pullRequest = (): Promise<{ hidden: boolean; number: string; state: string; checks: string; rows: string[][]; more: string; failure: string }> =>
      app.evaluate(`(() => ({
        hidden: document.getElementById("view-pull-request").hidden,
        number: document.getElementById("pull-request-number").textContent,
        state: document.getElementById("pull-request-state").textContent,
        checks: document.getElementById("pull-request-checks").textContent,
        rows: [...document.querySelectorAll("#pull-request-list .check")].map((row) => [row.tagName, row.querySelector(".state-icon").getAttribute("aria-label"), row.querySelector(".name").textContent, row.querySelector(".words").textContent]),
        more: document.getElementById("pull-request-more").textContent,
        failure: document.getElementById("pull-request-failure").textContent,
      }))()`);
    const opened = (): string[] => (existsSync(join(made.base, "opened")) ? readFileSync(join(made.base, "opened"), "utf8").trim().split("\n") : []);
    const second = await client();
    try {
      const workItem = second.alpha();
      await app.click(`#repositories button[data-work-item="${workItem.id}"]`);
      await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === "Alpha"`, "the view of Alpha");
      // No pull request yet, so nothing stands under the seal's place.
      expect((await pullRequest()).hidden).toBe(true);
      // The repository's one remote is a bare repository in the case's folder, and from here the gate passes.
      const bare = join(made.base, "origin.git");
      git(made.base, "init", "--quiet", "--bare", bare);
      git(made.repo, "remote", "add", "origin", bare);
      writeFileSync(join(made.base, "answers"), "");
      writeFileSync(join(made.base, "gate-passes"), "");
      await app.click("#get-seal");
      await app.until(`document.getElementById("seal-says").textContent === "Pull request #12 is open."`, "the sentence of the opened pull request", 30_000);
      expect(second.alpha().chain?.stages.map(({ kind, state }) => [kind, state]).slice(-3)).toEqual([["gate", "finished"], ["seal", "finished"], ["pull-request", "finished"]]);
      // The bare remote holds the branch at the worktree's head, and the stage committed nothing after the seal's record.
      expect(git(bare, "rev-parse", workItem.branch).trim()).toBe(git(workItem.worktree, "rev-parse", "HEAD").trim());
      expect(git(workItem.worktree, "log", "--format=%s", "-1").trim()).toBe("chore: record the sealer's verdict");
      expect(git(workItem.worktree, "status", "--porcelain").trim()).toBe("");

      await app.until(`!document.getElementById("view-pull-request").hidden && document.getElementById("pull-request-checks").textContent === "Checks passed"`, "the pull request under the seal's place");
      expect(await pullRequest()).toEqual({
        hidden: false,
        number: "Pull request #12",
        state: "Open",
        checks: "Checks passed",
        rows: [
          ["BUTTON", "Passed", "seal", "Passed"],
          ["BUTTON", "Passed", "Owlery seal", "Passed"],
        ],
        more: "",
        failure: "",
      });
      // The stage is not listed under "Ask": the gate's line and the sessions' lines are.
      expect(await app.evaluate(`[...document.querySelectorAll("#headless li")].some((li) => li.textContent.includes("Pull request"))`)).toBe(false);
      // The number opens the pull request's address, and a check's row the check's, through the program that stands for the browser.
      // The program runs apart from the window, so each click's address is waited for before the next click.
      const handed = async (count: number): Promise<string[]> => {
        for (const deadline = Date.now() + 5_000; opened().length < count && Date.now() < deadline; ) await new Promise((r) => setTimeout(r, 50));
        return opened();
      };
      await app.click("#pull-request-open");
      expect(await handed(1)).toEqual(["https://github.com/owner/project/pull/12"]);
      await app.click("#pull-request-list li:nth-child(2) .check");
      expect(await handed(2)).toEqual(["https://github.com/owner/project/pull/12", "https://github.com/owner/project/runs/22"]);

      // The work item's line has the state and the second row of a pull request whose checks passed.
      const line = `#inbox-lines button[data-work-item="${workItem.id}"]`;
      await app.click("#nav-inbox");
      await app.until(`!document.getElementById("inbox-screen").hidden && document.querySelector('${line} .says')?.textContent === "Checks passed"`, "the pull request's result in the line's second row");
      expect(await app.evaluate(`document.querySelector('${line} .state-icon').classList.contains("finished")`)).toBe(true);
    } finally {
      second.close();
    }
  });
});
