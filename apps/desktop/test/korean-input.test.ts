// The Korean input regression test's replayed case. It starts the built app,
// opens a shell pane whose process is the receiver, replays each line's
// composition into the pane through Electron's debugging port, and reads the
// bytes the receiver was handed. It does not stand for a macOS input source:
// a person's typed run does.
import { execFileSync, spawn } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BuiltApp, buildApp, endNow, untilGone } from "./built-app";
import {
  barText,
  compositionView,
  ENTER,
  FIXTURE,
  fixtureAfter,
  formatFixture,
  type Line,
  type LineResult,
  type Noted,
  openReceiverPane,
  readFixture,
  Received,
  RECEIVER,
  Recorder,
  showBar,
  type Step,
  stepsOf,
  typedTwice,
  Typing,
  verdicts,
  versions,
  withEnter,
} from "./korean-pane";
import { temporaryRepository } from "./repositories";

const lines = readFixture().lines;
/** The run a person types at a release, started by `pnpm run korean:typed`. Without it the file is the replayed case. */
const TYPED = process.env.OWLERY_KOREAN_TYPED === "1";

/** A whole syllable, as against a lone consonant. */
const SYLLABLE = /^[가-힣]$/u;

describe.skipIf(TYPED)("the receiver", () => {
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

describe.skipIf(TYPED)("Korean typed into a terminal pane", { timeout: 30_000 }, () => {
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
  const afterSyllable = withEnter(first).slice(composing + 1);

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
    await deliver(line, (typing) => typing.replay(withEnter(line)));
  });

  it("replays what the recorder noted of a line to the line's bytes again", async () => {
    const recorder = await Recorder.attach(app);
    await recorder.take();
    await deliver(first, (typing) => typing.replay(withEnter(first)));
    const noted = await recorder.take();
    // The record holds the line's Enter where it fell, so its steps are replayed as they are.
    await deliver(first, (typing) => typing.replay(stepsOf(noted)));
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

describe.skipIf(TYPED)("the typed run, without a person", () => {
  const down = (code: string, keyCode: number, key: string): Noted => ({ type: "keydown", code, keyCode, key });
  const up = (code: string, keyCode: number, key: string): Noted => ({ type: "keyup", code, keyCode, key });
  const enter: Step[] = ENTER;

  it("turns each recorded event into the step of its row", () => {
    const noted: Noted[] = [
      down("KeyG", 229, "Process"),
      { type: "compositionstart", data: "" },
      { type: "compositionupdate", data: "ㅎ" },
      { type: "input", inputType: "insertCompositionText", data: "ㅎ" },
      up("KeyG", 71, "ㅎ"),
      down("Digit1", 229, "Process"),
      { type: "compositionend", data: "ㅎ" },
      { type: "input", inputType: "insertText", data: "1" },
      up("Digit1", 49, "1"),
      down("Enter", 13, "Enter"),
      up("Enter", 13, "Enter"),
    ];
    expect(stepsOf(noted)).toEqual([
      { type: "imeKey", code: "KeyG" },
      { type: "compose", text: "ㅎ" },
      { type: "keyUp", code: "KeyG", key: "ㅎ", keyCode: 71 },
      { type: "imeKey", code: "Digit1" },
      { type: "commit", text: "ㅎ" },
      { type: "commit", text: "1" },
      { type: "keyUp", code: "Digit1", key: "1", keyCode: 49 },
      ...enter,
    ]);
  });

  it("takes no inserted text inside a composition for a committed one", () => {
    const noted: Noted[] = [down("KeyG", 229, "Process"), { type: "compositionstart", data: "" }, { type: "input", inputType: "insertText", data: "ㅎ" }, { type: "compositionend", data: "ㅎ" }, up("KeyG", 71, "ㅎ")];
    expect(stepsOf(noted).filter((step) => step.type === "commit")).toEqual([{ type: "commit", text: "ㅎ" }]);
  });

  it("takes the text a plain key inserts for that key's own", () => {
    const noted: Noted[] = [down("Digit1", 49, "1"), { type: "input", inputType: "insertText", data: "1" }, up("Digit1", 49, "1")];
    expect(stepsOf(noted)).toEqual([
      { type: "key", code: "Digit1", key: "1", keyCode: 49, text: "1" },
      { type: "keyUp", code: "Digit1", key: "1", keyCode: 49 },
    ]);
  });

  it("drops a release whose press the record does not hold, and releases a key still pressed at its end", () => {
    // The Enter of the line before is released after its bytes arrived, and this line's Enter after its own.
    expect(stepsOf([up("Enter", 13, "Enter"), down("Enter", 13, "Enter")])).toEqual(enter);
  });

  it("adds Enter to an assumed line, and replays a typed line as it was recorded", () => {
    const steps: Step[] = [{ type: "commit", text: "가" }];
    expect(withEnter({ text: "가", keys: "r k", steps, source: "assumed" })).toEqual([...steps, ...ENTER]);
    expect(withEnter({ text: "가", keys: "r k", steps: [...steps, ...enter], source: "typed" })).toEqual([...steps, ...enter]);
  });

  it("shows a line a second time where its bytes differed, and never a third", async () => {
    const typings = (...bytes: string[]): { asked: boolean[]; type: (again: boolean) => Promise<{ bytes: string; noted: Noted[] }> } => {
      const asked: boolean[] = [];
      return { asked, type: async (again) => (asked.push(again), { bytes: bytes[asked.length - 1]!, noted: [] }) };
    };
    const once = typings("aa");
    expect(await typedTwice("aa", once.type)).toMatchObject({ bytes: "aa", matched: true });
    expect(once.asked).toEqual([false]);
    const slipped = typings("ab", "aa");
    expect(await typedTwice("aa", slipped.type)).toMatchObject({ bytes: "aa", matched: true });
    expect(slipped.asked).toEqual([false, true]);
    const broken = typings("ab", "ac", "aa");
    expect(await typedTwice("aa", broken.type)).toMatchObject({ bytes: "ac", matched: false });
    expect(broken.asked).toEqual([false, true]);
  });

  const agrees: LineResult = { text: "한글", expected: "ed959ceab8800d", typed: "ed959ceab8800d", replay: { steps: enter, bytes: "ed959ceab8800d" } };
  const differs: LineResult = { text: "하나", expected: "ed9598eb82980d", typed: "ed9598eb82980d", replay: { steps: enter, bytes: "ed95980d" } };
  const failed: LineResult = { text: "갑시다", expected: "eab091ec8b9ceb8ba40d", typed: "" };
  const run = { date: "2026-11-20", macos: "26.5", electron: "45.3.3", xterm: "6.0.0" };

  it("gives a line the recorded steps where their replay agreed, and names one whose replay differed", () => {
    const fixture = readFixture();
    const after = fixtureAfter(fixture, [agrees, differs], run);
    expect(after.lines[0]).toEqual({ ...fixture.lines[0], steps: enter, source: "typed" });
    expect(after.lines.slice(1)).toEqual(fixture.lines.slice(1));
    expect(after.typedRun).toEqual({ ...run, replayDiffers: [{ text: "하나", received: "ed95980d" }] });
  });

  it("writes the fixture in the form it stands in", () => {
    const text = readFileSync(FIXTURE, "utf8");
    expect(formatFixture(readFixture())).toBe(text);
    const after = fixtureAfter(readFixture(), [agrees, differs], run);
    expect(JSON.parse(formatFixture(after))).toEqual(after);
  });

  it("prints a verdict for each line, and FAILED for a line typed otherwise", () => {
    expect(verdicts([agrees, differs, failed])).toEqual([
      "한글: typed as expected, and the replay of its recording agrees",
      "하나: typed as expected. The replay of its recording delivered ed95980d, so the line keeps its steps",
      "갑시다: FAILED. Expected eab091ec8b9ceb8ba40d, received nothing",
    ]);
  });

  it("names the line, its keys and its place in the bar", () => {
    const line: Line = { text: "하나", keys: "g k s k", steps: [], source: "assumed" };
    expect(barText(line, 1, 10, false)).toBe('Line 2 of 10. Click the terminal, then type 하나 (keys: g k s k) and press Enter. The terminal shows nothing of what you type.');
    expect(barText(line, 1, 10, true)).toBe('Line 2 of 10, once more: the bytes differed. Click the terminal, then type 하나 (keys: g k s k) and press Enter. The terminal shows nothing of what you type.');
  });

  it("reads the versions a typed run is recorded with", () => {
    // The version `package.json` pins, which is exact, so an upgrade of `@xterm/xterm` moves both sides of the comparison.
    const pinned = (JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8")) as { dependencies: Record<string, string> }).dependencies["@xterm/xterm"];
    expect(versions(new Date(2026, 10, 20))).toEqual({ date: "2026-11-20", macos: expect.stringMatching(/^\d+\.\d+/), electron: process.versions.electron, xterm: pinned });
  });

  it("reads a typed line once its Enter arrived, and what there is where none does", async () => {
    const repository = temporaryRepository("typed-line");
    try {
      const file = join(repository.base, "received");
      writeFileSync(file, "a");
      const received = new Received(file);
      // Later than the moment `typed` waits after an Enter, so a reading that did not wait for the Enter holds "a" alone.
      setTimeout(() => appendFileSync(file, "b\r"), 800);
      expect((await received.typed(4_000)).toString()).toBe("ab\r");
      appendFileSync(file, "c");
      expect((await received.typed(100)).toString()).toBe("c");
    } finally {
      repository.remove();
    }
  });

  it("ends processes at once, one that its parent has not read yet among them, and kills one that stays", () => {
    const quits = spawn("sleep", ["60"], { stdio: "ignore" });
    // A shell that ignores the request to end and waits on its input.
    const stays = spawn("sh", ["-c", 'trap "" TERM; read line'], { stdio: ["pipe", "ignore", "ignore"] });
    const began = Date.now();
    expect(endNow([quits.pid!], 5_000)).toEqual([]);
    // The event loop had no turn, so the ended process is still listed: it is read as ended, and the call does not wait for its bound.
    expect(Date.now() - began).toBeLessThan(2_000);
    expect(endNow([stays.pid!], 300)).toEqual([stays.pid]);
    expect(endNow([stays.pid!], 2_000)).toEqual([]);
  });
});

describe.runIf(TYPED)("the typed run", () => {
  it("receives every line a person types as typed, and records what the typing produced", async () => {
    buildApp();
    const repository = temporaryRepository("korean-typed");
    const receivedFile = join(repository.base, "received");
    // `OWLERY_BACKGROUND` stays as the command's own environment has it: a person's run opens the app as it ships, with the keyboard.
    const app = await BuiltApp.start({ SHELL: RECEIVER, OWLERY_WORKTREES: repository.root, OWLERY_RECEIVER_FILE: receivedFile }, { keepBackground: true });
    // A person stops the run with Ctrl-C, which no `finally` outlives. The daemon is no child of the run, so it is ended here.
    const end = (): void => {
      app.stopNow();
      repository.remove();
    };
    const interrupted = (): void => {
      end();
      process.exit(130);
    };
    for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) process.once(signal, interrupted);
    process.once("exit", end);
    try {
      // The form is filled through the debugging port, which needs the page to report the focus. The person's own typing needs none emulated.
      await app.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
      await openReceiverPane(app, repository.repo, receivedFile);
      await app.cdp("Emulation.setFocusEmulationEnabled", { enabled: false });
      const received = new Received(receivedFile);
      const recorder = await Recorder.attach(app);
      const results: LineResult[] = [];
      for (const [index, line] of lines.entries()) {
        const expected = Buffer.from(`${line.text}\r`, "utf8").toString("hex");
        const typed = await typedTwice(expected, async (again) => {
          await showBar(app, barText(line, index, lines.length, again));
          await recorder.take();
          const bytes = await received.typed(600_000);
          return { bytes: bytes.toString("hex"), noted: await recorder.take() };
        });
        const result: LineResult = { text: line.text, expected, typed: typed.bytes };
        if (typed.matched) {
          await showBar(app, `Line ${index + 1} of ${lines.length} arrived as typed. Replaying its recording: type nothing.`);
          const steps = stepsOf(typed.noted);
          await (await Typing.start(app)).replay(steps);
          result.replay = { steps, bytes: (await received.next(expected.length / 2)).toString("hex") };
        }
        results.push(result);
      }
      const failed = results.filter((result) => result.typed !== result.expected).map((result) => result.text);
      for (const verdict of verdicts(results)) console.log(verdict);
      await showBar(app, failed.length === 0 ? "Every line arrived as typed. The run is over." : `The run is over. Failed: ${failed.join(", ")}`);
      // A run with a failed line records nothing: the fixture changes with a run that passed.
      if (failed.length === 0) writeFileSync(FIXTURE, formatFixture(fixtureAfter(readFixture(), results, versions(new Date()))));
      expect(failed).toEqual([]);
    } finally {
      for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) process.off(signal, interrupted);
      process.off("exit", end);
      await app.stop();
      repository.remove();
    }
  }, 3_600_000);
});
