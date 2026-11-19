// The Korean input regression test's replayed case. It starts the built app,
// opens a shell pane whose process is the receiver, replays each line's
// composition into the pane through Electron's debugging port, and reads the
// bytes the receiver was handed. It does not stand for a macOS input source:
// a person's typed run does.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BuiltApp, buildApp, untilGone } from "./built-app";
import { compositionView, ENTER, type Line, openReceiverPane, readLines, Received, RECEIVER, Typing } from "./korean-pane";
import { temporaryRepository } from "./repositories";

const lines = readLines();

/** A whole syllable, as against a lone consonant. */
const SYLLABLE = /^[가-힣]$/u;

describe("the receiver", () => {
  it("exits at once and writes nothing where its input is no terminal", () => {
    // The daemon runs $SHELL that way to look for `claude`, and a receiver that stayed would empty the file the pane's receiver writes.
    const repository = temporaryRepository("receiver");
    try {
      const file = join(repository.base, "received");
      execFileSync(RECEIVER, ["-l", "-i", "-c", "true"], { env: { ...process.env, OWLERY_RECEIVER_FILE: file }, stdio: ["pipe", "ignore", "ignore"], timeout: 2_000 });
      expect(existsSync(file)).toBe(false);
      expect(existsSync(`${file}.pid`)).toBe(false);
    } finally {
      repository.remove();
    }
  });
});

describe("Korean typed into a terminal pane", { timeout: 30_000 }, () => {
  let app: BuiltApp;
  let repository: ReturnType<typeof temporaryRepository>;
  let received: Received;

  beforeAll(async () => {
    buildApp();
    repository = temporaryRepository("korean-input");
    const receivedFile = join(repository.base, "received");
    app = await BuiltApp.start({ SHELL: RECEIVER, OWLERY_WORKTREES: repository.root, OWLERY_RECEIVER_FILE: receivedFile });
    // The app starts in the background, and the page of a window without the system's focus reports none.
    await app.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
    await openReceiverPane(app, repository.repo, receivedFile);
    received = new Received(receivedFile);
  }, 120_000);

  afterAll(async () => {
    // A case that failed before the last one leaves the app running.
    await app?.stop();
    repository?.remove();
  }, 30_000);

  /**
   * Types a line with `type`, which ends it with Enter, and reads what the
   * receiver was handed for it. It fails with the line and both byte strings
   * in hex. A line is typed once. Where a composition of the line was ended
   * by something outside the window, the failing line says so.
   */
  async function deliver(line: Line, type: (typing: Typing) => Promise<void>): Promise<void> {
    const expected = Buffer.from(`${line.text}\r`, "utf8");
    const typing = await Typing.start(app);
    await type(typing);
    const got = await received.next(expected.length);
    const outside = (await typing.endedFromOutside()) ? ", and something outside the window ended a composition of the line" : "";
    expect(got.toString("hex"), `the line "${line.text}": expected ${expected.toString("hex")}, received ${got.toString("hex") || "nothing"}${outside}`).toBe(expected.toString("hex"));
  }

  // The first whole syllable the first line composes. Every step after it, up to its commit, leaves it uncommitted.
  const first = lines[0]!;
  const composing = first.steps.findIndex((step) => step.type === "compose" && SYLLABLE.test(step.text));
  const syllable = (first.steps[composing] as { text: string }).text;
  const upToSyllable = first.steps.slice(0, composing + 1);
  const afterSyllable = [...first.steps.slice(composing + 1), ...ENTER];

  it("opens one pane through the form, of the shell kind", async () => {
    expect(await app.evaluate<string[]>(`[...document.querySelectorAll("#tabs .tab .label")].map((label) => label.textContent)`)).toEqual(["Shell 1"]);
  });

  it("stays in the background: no Dock icon, and no focus of the system's", () => {
    // `UIElement` is the system's type for an app with no Dock icon, which a start does not bring to the front.
    expect(execFileSync("lsappinfo", ["info", "-only", "ApplicationType", String(app.pid)], { encoding: "utf8" }).trim()).toBe('"ApplicationType"="UIElement"');
    expect(app.focusedAtStart).toBe(false);
  });

  it("gives the new pane the keyboard, which the case never does", async () => {
    const focused = await app.evaluate<boolean>(`document.activeElement === document.querySelector("#stage .pane:not([hidden]) .xterm-helper-textarea")`);
    expect(focused).toBe(true);
  });

  it("shows the syllable being composed until it is committed", async () => {
    let whileComposing: Awaited<ReturnType<typeof compositionView>> = null;
    let afterTheLine: Awaited<ReturnType<typeof compositionView>> = null;
    await deliver(first, async (typing) => {
      await typing.replay(upToSyllable);
      whileComposing = await compositionView(app);
      await typing.replay(afterSyllable);
      afterTheLine = await compositionView(app);
    });
    expect(whileComposing).toEqual({ active: true, text: syllable });
    expect(afterTheLine).toMatchObject({ active: false });
  });

  it.each(lines)("hands the pane's process $text as typed", async (line) => {
    await deliver(line, (typing) => typing.replay([...line.steps, ...ENTER]));
  });

  it("names a composition that something outside the window ended, and types the line once", async () => {
    const typing = await Typing.start(app);
    await typing.replay(upToSyllable);
    // What reaches the pane where the system ends a composition: the composing syllable is committed where it stands, by no step, and the page sees no blur.
    await app.cdp("Input.insertText", { text: syllable });
    await typing.replay(afterSyllable);
    // The line's bytes are read so that no later reading holds them.
    await received.next(Buffer.byteLength(`${first.text}\r`));
    expect(await typing.endedFromOutside()).toBe(true);
  });

  it("does not take a composition the window's own code ended for one ended from outside", async () => {
    const typing = await Typing.start(app);
    await typing.replay(upToSyllable);
    // What the window's own code would do by moving the focus while a person types. A click gives the pane the keyboard back.
    await app.evaluate("document.activeElement.blur()");
    await app.click("#stage .pane:not([hidden])");
    await typing.replay(afterSyllable);
    // The line's bytes are read so that no later reading holds them.
    await received.next(Buffer.byteLength(`${first.text}\r`));
    expect(await typing.endedFromOutside()).toBe(false);
  });

  it("stops the app, the daemon and the receiver, and removes its folders", async () => {
    const daemon = app.daemonPid();
    const receiver = received.pid();
    expect(daemon).toBeTypeOf("number");
    // The app and the daemon ended when asked to: none had to be killed.
    expect(await app.stop()).toEqual([]);
    // The receiver ends with the daemon that held its terminal.
    expect(await untilGone([daemon!, receiver], 5_000)).toEqual([]);
    repository.remove();
    expect(existsSync(app.userData)).toBe(false);
    expect(existsSync(repository.base)).toBe(false);
  });
});
