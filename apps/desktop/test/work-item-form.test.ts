// The "New work item" form in the built app. It starts the app once, in the
// background, on a temporary clone, and drives the form through Electron's
// debugging port: the name the window generates, the branch and the base the
// daemon's plan gives, what the form says of the fetch of a remote's branch,
// a creation from a base the person chose, and the setup a repository names,
// from the form to the work item's view. Its remote is a folder beside
// the clone, and then a stand-in that never answers, so nothing reaches the
// network.
import { renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FIRST_WORDS, SECOND_WORDS } from "../src/shared/names";
import { BuiltApp, buildApp } from "./built-app";
import { RECEIVER } from "./korean-pane";
import { commitFile, git, temporaryClone, unansweringOrigin } from "./repositories";

describe("the new work item form in the built app", { timeout: 30_000 }, () => {
  let app: BuiltApp;
  let clone: ReturnType<typeof temporaryClone>;
  /** The commit of the checkout's branch `feature`, one ahead of the remote's `main`. */
  let featureCommit: string;
  /** The commit the remote's `main` gained before the form opened, which the clone did not fetch. */
  let remoteCommit: string;
  /** The commit the remote's `main` gained after the form's first fetch. */
  let laterCommit: string;
  /** The name the window generated when the form opened. */
  let generated: string;
  /** The remote that never answers, once a case made `origin` one. */
  let unanswering: ReturnType<typeof unansweringOrigin> | undefined;

  const text = (id: string): Promise<string> => app.evaluate<string>(`document.getElementById(${JSON.stringify(id)}).textContent`);
  const shows = (branch: string): Promise<void> => app.until(`document.getElementById("work-item-branch").textContent === ${JSON.stringify(branch)}`, `the branch ${branch} in the form`);
  /** Waits until the paragraph under "Starts from" reads `sentence`. */
  const says = (sentence: string, ms?: number): Promise<void> => app.until(`document.getElementById("work-item-base-state").textContent === ${JSON.stringify(sentence)}`, `"${sentence}" under "Starts from"`, ms);
  const remoteMain = (): string => git(clone.repo, "rev-parse", "refs/remotes/origin/main").trim();
  /** Opens the form and gives the name it generated and the branch that name gets, which carries a number where the name is taken. */
  const openForm = async (): Promise<{ name: string; branch: string }> => {
    await app.click("#new-work-item");
    await app.until(`document.getElementById("work-item-dialog").open`, 'the "New work item" form');
    const name = await app.evaluate<string>(`document.getElementById("work-item-title").placeholder`);
    await app.until(`[${JSON.stringify(`owlery/${name}`)}, ${JSON.stringify(`owlery/${name}-2`)}].includes(document.getElementById("work-item-branch").textContent)`, "the branch of the new opening's name");
    return { name, branch: await text("work-item-branch") };
  };
  /** Presses Create with a shell as the pane, and waits for the view of the work item `name`. */
  const create = async (name: string, ms?: number): Promise<void> => {
    await app.evaluate(`document.getElementById("work-item-kind").value = "shell"`);
    await app.click("#work-item-create");
    try {
      await app.until(`!document.getElementById("work-item-dialog").open && !document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === ${JSON.stringify(name)}`, `the view of the work item ${name}`, ms);
    } catch (error) {
      throw new Error(`${(error as Error).message}; the form says: ${(await text("work-item-error")) || "nothing"}`);
    }
  };

  beforeAll(async () => {
    buildApp();
    clone = temporaryClone();
    git(clone.repo, "checkout", "--quiet", "-b", "feature");
    featureCommit = commitFile(clone.repo, "feature.txt");
    remoteCommit = commitFile(clone.origin, "moved.txt");
    // The pane's process is the receiver, so no shell of the person's and no agent starts.
    app = await BuiltApp.start({ SHELL: RECEIVER, OWLERY_WORKTREES: clone.root, OWLERY_RECEIVER_FILE: join(clone.base, "received") });
    // The app starts in the background, and the page of a window without the system's focus reports none.
    await app.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
    await app.until(`["summary-screen", "inbox-screen", "history-screen"].some((id) => document.getElementById(id)?.hidden === false)`, "a screen in front");
  }, 120_000);

  afterAll(async () => {
    await app?.stop();
    unanswering?.stop();
    clone?.remove();
  }, 30_000);

  it("offers a generated name, and shows the branch it gives and the remote's default branch as the base", async () => {
    await app.click("#new-work-item");
    await app.until(`document.getElementById("work-item-dialog").open`, 'the "New work item" form');
    expect(await app.evaluate<string>(`document.getElementById("work-item-title").labels[0].firstChild.textContent.trim()`)).toBe("Name");
    generated = await app.evaluate<string>(`document.getElementById("work-item-title").placeholder`);
    const [first, second, ...more] = generated.split("-");
    expect(FIRST_WORDS).toContain(first);
    expect(SECOND_WORDS).toContain(second);
    expect(more).toEqual([]);
    // No repository yet: the form shows no branch, and the menu holds nothing.
    expect(await text("work-item-branch")).toBe("");
    expect(await app.evaluate<boolean>(`document.getElementById("work-item-base").disabled`)).toBe(true);

    // A folder outside any repository: the daemon's refusal stands in the branch's place, and not in the window's status line.
    await app.click("#work-item-repo");
    await app.cdp("Input.insertText", { text: clone.base });
    await shows(`${clone.base} is not inside a git repository`);
    expect(await app.evaluate<boolean>(`document.getElementById("work-item-plan").classList.contains("failed")`)).toBe(true);
    expect(await app.evaluate<boolean>(`document.getElementById("status").classList.contains("notice")`)).toBe(false);
    expect(await app.evaluate<boolean>(`document.getElementById("work-item-base").disabled`)).toBe(true);

    await app.evaluate(`document.getElementById("work-item-repo").select()`);
    await app.cdp("Input.insertText", { text: clone.repo });
    await shows(`owlery/${generated}`);
    expect(await app.evaluate<boolean>(`document.getElementById("work-item-plan").classList.contains("failed")`)).toBe(false);
    expect(await text("work-item-worktree")).toBe(join(clone.root, "project", generated));
    // The checkout stands on `feature`, and the work item starts from the remote's `main`.
    expect(await app.evaluate<string>(`document.getElementById("work-item-base").value`)).toBe("origin/main");
    expect(await app.evaluate<boolean>(`document.getElementById("work-item-base").disabled`)).toBe(false);
    expect(await app.evaluate<string[]>(`[...document.getElementById("work-item-base").children].map((child) => child.tagName === "OPTGROUP" ? child.label + ": " + [...child.children].map((option) => option.value).join(" ") : child.value)`)).toEqual([
      "origin/main",
      "Local: feature main",
    ]);
  });

  it("fetches the remote's branch the menu holds, and says the commit it is at", async () => {
    await says(`Fetched: origin/main is at ${remoteCommit.slice(0, 7)}.`);
    expect(remoteMain()).toBe(remoteCommit);
    expect(await app.evaluate<string | null>(`document.getElementById("work-item-base-state").getAttribute("aria-live")`)).toBe("polite");
    // The form that registers a repository alone starts no work item, and says nothing of where one would start.
    // At the choice, and not once the wait for an answer has passed.
    await app.click("#work-item-register-only");
    await says("", 2_000);
    await app.click("#work-item-register-only");
    await says(`Fetched: origin/main is at ${remoteCommit.slice(0, 7)}.`);
  });

  it("shows the branch of a name as it is typed, and asks the remote nothing for it", async () => {
    laterCommit = commitFile(clone.origin, "later.txt");
    await app.click("#work-item-title");
    await app.cdp("Input.insertText", { text: "Fix login" });
    await shows("owlery/fix-login");
    expect(await text("work-item-worktree")).toBe(join(clone.root, "project", "fix-login"));
    // The plan of the new name lists the same base, which the form asked for once since it opened.
    expect(await text("work-item-base-state")).toBe(`Fetched: origin/main is at ${remoteCommit.slice(0, 7)}.`);
    expect(remoteMain()).toBe(remoteCommit);
  });

  it("creates a work item named by the generated name, from the base the person chose", async () => {
    // The name is emptied with a key, as a person empties it.
    await app.evaluate(`document.getElementById("work-item-title").select()`);
    await app.cdp("Input.dispatchKeyEvent", { type: "keyDown", windowsVirtualKeyCode: 8, code: "Backspace", key: "Backspace" });
    await app.cdp("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: 8, code: "Backspace", key: "Backspace" });
    expect(await app.evaluate<string>(`document.getElementById("work-item-title").value`)).toBe("");
    await shows(`owlery/${generated}`);
    // The two menus are the system's own, which the debugging port does not reach, so each choice is set on its field.
    await app.evaluate(`(() => { const menu = document.getElementById("work-item-base"); menu.value = "feature"; menu.dispatchEvent(new Event("change", { bubbles: true })); })()`);
    // A local branch is fetched from nowhere, so the form says nothing under the menu.
    expect(await text("work-item-base-state")).toBe("");
    await create(generated);
    await app.until(`document.querySelectorAll(".xterm-helper-textarea").length === 1`, "the work item's view with one terminal");
    expect(git(clone.repo, "rev-parse", `refs/heads/owlery/${generated}`).trim()).toBe(featureCommit);
    expect(featureCommit).not.toBe(remoteMain());
  });

  it("opens again on the same repository with the default base, and not with the base chosen the last time, and fetches that base again", async () => {
    // The name of the last opening is taken, so an equal draw shows its number.
    await openForm();
    expect(await app.evaluate<string>(`document.getElementById("work-item-repo").value`)).toBe(clone.repo);
    expect(await app.evaluate<string>(`document.getElementById("work-item-base").value`)).toBe("origin/main");
    // Each opening forgets what the last one asked, so the commit the remote gained since is fetched.
    await says(`Fetched: origin/main is at ${laterCommit.slice(0, 7)}.`);
    expect(remoteMain()).toBe(laterCommit);
    await app.click("#work-item-cancel");
    await app.until(`!document.getElementById("work-item-dialog").open`, "the form closed");
  });

  it("names the repository's setup before the creation and creates nothing before it does, and shows its pane's tab, its words on the line and its section in the view, which names the command and runs it again", async () => {
    // The two files stand untracked in the main checkout. The setup pane's process is the receiver too, so the setup runs until its pane is closed.
    writeFileSync(join(clone.repo, ".worktreeinclude"), "notes.txt\n");
    writeFileSync(join(clone.repo, ".worktreesetup"), "make setup\n");
    try {
      const TABS = `[...document.querySelectorAll("#tabs .tab .label")].map((label) => label.textContent).join(", ")`;
      const SAYS = `document.querySelector("#view-detail .setup .setup-says")?.textContent`;
      const COMMAND = `document.querySelector("#view-detail .setup .setup-command")?.textContent`;
      const RUN_AGAIN = `(document.querySelector("#view-detail .setup button")?.textContent ?? null)`;
      const SETUP_LINE = `document.getElementById("work-item-setup").textContent === "Copies the ignored files .worktreeinclude names from the main checkout. Then runs: make setup"`;
      const { name } = await openForm();
      await app.until(SETUP_LINE, "the setup under the name");
      // Create pressed at once after a key in the folder field, before the plan of the field's new text answers, creates nothing.
      const setRepo = (folder: string, press: boolean) =>
        app.evaluate(`(() => { const field = document.getElementById("work-item-repo"); field.value = ${JSON.stringify(folder)}; field.dispatchEvent(new Event("input")); if (${String(press)}) document.getElementById("work-item-create").click(); })()`);
      await setRepo(`${clone.repo}/`, true);
      expect(await text("work-item-error")).toBe("Wait until the form shows what this folder's work item gets, its setup among it.");
      expect(await app.evaluate<boolean>(`document.getElementById("work-item-dialog").open`)).toBe(true);
      await setRepo(clone.repo, false);
      await app.until(SETUP_LINE, "the setup under the name again");
      await create(name);
      await app.until(`${TABS} === "Setup, Shell"`, "the setup pane's tab before the shell's");
      await app.until(`${SAYS} === "The command has run for less than a minute." && ${COMMAND} === "Command: make setup"`, "the setup's section, naming the command");
      expect(await app.evaluate<string | null>(RUN_AGAIN)).toBeNull();
      const lineSetup = `[...document.querySelectorAll("#inbox-lines button.line")].find((line) => line.querySelector(".title")?.textContent === ${JSON.stringify(name)})?.querySelector(".setup")`;
      await app.click("#nav-inbox");
      await app.until(`${lineSetup}?.textContent === "Setting up"`, "Setting up on the line");
      await app.evaluate(`${lineSetup}.closest("button").click()`);
      await app.until(`document.getElementById("view-title").textContent === ${JSON.stringify(name)} && ${TABS} === "Setup, Shell"`, "the view again");
      // The person closes the setup pane, so its command did not end.
      await app.click("#tabs .tab:nth-child(1) .close");
      await app.until(`${SAYS} === "The setup pane ended before its command did." && ${RUN_AGAIN} === "Run setup again"`, "the setup failed, with a run again");
      expect(await app.evaluate<string>(TABS)).toBe("Shell");
      await app.click("#nav-inbox");
      await app.until(`${lineSetup}?.textContent === "Setup failed" && ${lineSetup}.classList.contains("failed")`, "Setup failed on the line");
      await app.evaluate(`${lineSetup}.closest("button").click()`);
      await app.until(`${RUN_AGAIN} === "Run setup again"`, "the view's run again");
      await app.click("#view-detail .setup button");
      // The tabs stand in the order the panes started.
      await app.until(`${TABS} === "Shell, Setup" && document.querySelector("#tabs .tab.active .label")?.textContent === "Setup"`, "the new setup pane in front");
      await app.until(`${SAYS} === "The command has run for less than a minute." && ${RUN_AGAIN} === null`, "the setup running again");
    } finally {
      rmSync(join(clone.repo, ".worktreeinclude"));
      rmSync(join(clone.repo, ".worktreesetup"));
    }
  });

  it("says that a branch could not be fetched and since when the clone holds its commit, and still creates the work item there", async () => {
    renameSync(clone.origin, `${clone.origin}-moved-away`);
    const { name, branch } = await openForm();
    await app.until(`document.getElementById("work-item-base-state").textContent.startsWith("origin/main could not be fetched (")`, "that origin/main could not be fetched");
    // The clone's branch moved at the fetch of the opening before, moments ago.
    expect(await text("work-item-base-state")).toContain(`). It starts as last fetched, at ${laterCommit.slice(0, 7)}, which the clone has held for less than a minute.`);
    await create(name);
    expect(git(clone.repo, "rev-parse", `refs/heads/${branch}`).trim()).toBe(laterCommit);
    // The form said it before the creation, so the status line has nothing to add.
    expect(await app.evaluate<boolean>(`document.getElementById("status").classList.contains("notice")`)).toBe(false);
  });

  it("creates while the fetch is under way, and says in the status line that the branch could not be fetched", async () => {
    unanswering = unansweringOrigin(clone);
    const { name, branch } = await openForm();
    await says("Fetching origin/main…");
    // The button does not wait for the fetch.
    expect(await app.evaluate<boolean>(`document.getElementById("work-item-create").disabled`)).toBe(false);
    // The daemon gives the remote ten seconds, and the creation joins that fetch.
    await create(name, 20_000);
    expect(git(clone.repo, "rev-parse", `refs/heads/${branch}`).trim()).toBe(laterCommit);
    const status = await text("status");
    expect(status.startsWith(`origin/main could not be fetched (origin did not answer in 10 seconds). It starts as last fetched, at ${laterCommit.slice(0, 7)}, which the clone has held for `)).toBe(true);
    expect(await app.evaluate<boolean>(`document.getElementById("status").classList.contains("notice")`)).toBe(true);
    expect(unanswering.started()).toHaveLength(1);
  });
});
