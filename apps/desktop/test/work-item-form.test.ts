// The "New work item" form in the built app. It starts the app once, in the
// background, on a temporary clone, and drives the form through Electron's
// debugging port: the name the window generates, the branch and the base the
// daemon's plan gives, and a creation from a base the person chose.
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FIRST_WORDS, SECOND_WORDS } from "../src/shared/names";
import { BuiltApp, buildApp } from "./built-app";
import { RECEIVER } from "./korean-pane";
import { commitFile, git, temporaryClone } from "./repositories";

describe("the new work item form in the built app", { timeout: 30_000 }, () => {
  let app: BuiltApp;
  let clone: ReturnType<typeof temporaryClone>;
  /** The commit of the checkout's branch `feature`, one ahead of the remote's `main`. */
  let featureCommit: string;
  /** The name the window generated when the form opened. */
  let generated: string;

  const text = (id: string): Promise<string> => app.evaluate<string>(`document.getElementById(${JSON.stringify(id)}).textContent`);
  const shows = (branch: string): Promise<void> => app.until(`document.getElementById("work-item-branch").textContent === ${JSON.stringify(branch)}`, `the branch ${branch} in the form`);

  beforeAll(async () => {
    buildApp();
    clone = temporaryClone();
    git(clone.repo, "checkout", "--quiet", "-b", "feature");
    featureCommit = commitFile(clone.repo, "feature.txt");
    // The pane's process is the receiver, so no shell of the person's and no agent starts.
    app = await BuiltApp.start({ SHELL: RECEIVER, OWLERY_WORKTREES: clone.root, OWLERY_RECEIVER_FILE: join(clone.base, "received") });
    // The app starts in the background, and the page of a window without the system's focus reports none.
    await app.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
    await app.until(`["summary-screen", "inbox-screen", "history-screen"].some((id) => document.getElementById(id)?.hidden === false)`, "a screen in front");
  }, 120_000);

  afterAll(async () => {
    await app?.stop();
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

  it("shows the branch of a name as it is typed", async () => {
    await app.click("#work-item-title");
    await app.cdp("Input.insertText", { text: "Fix login" });
    await shows("owlery/fix-login");
    expect(await text("work-item-worktree")).toBe(join(clone.root, "project", "fix-login"));
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
    await app.evaluate(`document.getElementById("work-item-kind").value = "shell"`);
    await app.click("#work-item-create");
    try {
      await app.until(`!document.getElementById("work-item-view").hidden && document.querySelectorAll(".xterm-helper-textarea").length === 1`, "the work item's view with one terminal");
    } catch (error) {
      throw new Error(`${(error as Error).message}; the form says: ${(await text("work-item-error")) || "nothing"}`);
    }
    expect(await text("view-title")).toBe(generated);
    expect(git(clone.repo, "rev-parse", `refs/heads/owlery/${generated}`).trim()).toBe(featureCommit);
    expect(featureCommit).not.toBe(git(clone.repo, "rev-parse", "refs/remotes/origin/main").trim());
  });

  it("opens again on the same repository with the default base, and not with the base chosen the last time", async () => {
    await app.click("#new-work-item");
    await app.until(`document.getElementById("work-item-dialog").open`, 'the "New work item" form');
    expect(await app.evaluate<string>(`document.getElementById("work-item-repo").value`)).toBe(clone.repo);
    const next = await app.evaluate<string>(`document.getElementById("work-item-title").placeholder`);
    // The name of the last opening is taken, so an equal draw shows its number.
    await app.until(`[${JSON.stringify(`owlery/${next}`)}, ${JSON.stringify(`owlery/${next}-2`)}].includes(document.getElementById("work-item-branch").textContent)`, "the branch of the new opening's name");
    expect(await app.evaluate<string>(`document.getElementById("work-item-base").value`)).toBe("origin/main");
    await app.click("#work-item-cancel");
    await app.until(`!document.getElementById("work-item-dialog").open`, "the form closed");
  });
});
