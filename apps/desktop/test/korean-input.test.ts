// The Korean input regression test's replayed case. It starts the built app,
// opens a shell pane whose process is the receiver, replays each line's
// composition into the pane through Electron's debugging port, and reads the
// bytes the receiver was handed. It does not stand for a macOS input source:
// a person's typed run does.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BuiltApp, buildApp, untilGone } from "./built-app";
import { compositionView, ENTER, type Line, openReceiverPane, readLines, Received, RECEIVER, replay } from "./korean-pane";
import { temporaryRepository } from "./repositories";

const lines = readLines();

/** A whole syllable, as against a lone consonant. */
const SYLLABLE = /^[가-힣]$/u;

describe("Korean typed into a terminal pane", { timeout: 30_000 }, () => {
  let app: BuiltApp;
  let repository: ReturnType<typeof temporaryRepository>;
  let received: Received;

  beforeAll(async () => {
    buildApp();
    repository = temporaryRepository("korean-input");
    const receivedFile = join(repository.base, "received");
    app = await BuiltApp.start({ SHELL: RECEIVER, OWLERY_WORKTREES: repository.root, OWLERY_RECEIVER_FILE: receivedFile });
    // The window the case starts may not have the system's focus.
    await app.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
    await openReceiverPane(app, repository.repo, receivedFile);
    received = new Received(receivedFile);
  }, 120_000);

  afterAll(async () => {
    // A case that failed before the last one leaves the app running.
    await app?.stop();
    repository?.remove();
  }, 30_000);

  /** Reads what the receiver was handed for a line, and fails with the line and both byte strings in hex. */
  async function expectDelivered(line: Line): Promise<void> {
    const expected = Buffer.from(`${line.text}\r`, "utf8");
    const got = await received.next(expected.length);
    expect(got.toString("hex"), `the line "${line.text}": expected ${expected.toString("hex")}, received ${got.toString("hex") || "nothing"}`).toBe(expected.toString("hex"));
  }

  it("opens one pane through the form, of the shell kind", async () => {
    expect(await app.evaluate<string[]>(`[...document.querySelectorAll("#tabs .tab .label")].map((label) => label.textContent)`)).toEqual(["Shell 1"]);
  });

  it("gives the new pane the keyboard, which the case never does", async () => {
    const focused = await app.evaluate<boolean>(`document.activeElement === document.querySelector("#stage .pane:not([hidden]) .xterm-helper-textarea")`);
    expect(focused).toBe(true);
  });

  it("shows the syllable being composed until it is committed", async () => {
    const line = lines[0]!;
    // The first whole syllable the line composes: every later step up to its commit leaves it uncommitted.
    const composing = line.steps.findIndex((step) => step.type === "compose" && SYLLABLE.test(step.text));
    const syllable = line.steps[composing] as { text: string };
    await replay(app, line.steps.slice(0, composing + 1));
    expect(await compositionView(app)).toEqual({ active: true, text: syllable.text });
    await replay(app, [...line.steps.slice(composing + 1), ...ENTER]);
    expect((await compositionView(app))?.active).toBe(false);
    await expectDelivered(line);
  });

  it.each(lines)("hands the pane's process $text as typed", async (line) => {
    await replay(app, [...line.steps, ...ENTER]);
    await expectDelivered(line);
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
