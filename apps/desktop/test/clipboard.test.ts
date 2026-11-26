import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { type Clipboard, chooseClipboard, PASTED_DAYS, pastedImage } from "../src/main/clipboard";

/** A stand-in for the system's clipboard that notes each call and holds a text, and an image's bytes where `image` is given. No case reads or writes the system's. */
function noting(held = "", image: Uint8Array | null = null): { calls: string[]; system: Clipboard } {
  const calls: string[] = [];
  let text = held;
  return {
    calls,
    system: {
      async readImage() {
        calls.push("read image");
        return image;
      },
      async writeText(written) {
        calls.push(`write ${written}`);
        text = written;
      },
      async readText() {
        calls.push("read");
        return text;
      },
    },
  };
}

describe("chooseClipboard", () => {
  it("keeps a clipboard of the app's own in the background: it starts empty, a text written is the text read back, and the system's is never called", async () => {
    const { calls, system } = noting("what the person copied");
    const clipboard = chooseClipboard(true, system);
    expect(await clipboard.readText()).toBe("");
    await clipboard.writeText("https://example.com/a");
    expect(await clipboard.readText()).toBe("https://example.com/a");
    await clipboard.writeText("/tmp/b");
    expect(await clipboard.readText()).toBe("/tmp/b");
    expect(calls).toEqual([]);
  });

  it("keeps each background start's clipboard apart from another's", async () => {
    const first = chooseClipboard(true, noting().system);
    await first.writeText("first");
    expect(await chooseClipboard(true, noting().system).readText()).toBe("");
  });

  it("writes and reads the system's clipboard otherwise", async () => {
    const { calls, system } = noting("what the person copied");
    const clipboard = chooseClipboard(false, system);
    expect(await clipboard.readText()).toBe("what the person copied");
    await clipboard.writeText("/tmp/b");
    expect(await clipboard.readText()).toBe("/tmp/b");
    expect(calls).toEqual(["read", "write /tmp/b", "read"]);
  });

  it("reads no image of the system's clipboard in the background, and the system's image otherwise (scenario D4)", async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const background = noting("", bytes);
    expect(await chooseClipboard(true, background.system).readImage()).toBeNull();
    expect(background.calls).toEqual([]);
    const person = noting("", bytes);
    expect(await chooseClipboard(false, person.system).readImage()).toEqual(bytes);
    expect(person.calls).toEqual(["read image"]);
  });

  it.each([true, false])("writes nothing for a value that is no text (in the background: %s)", async (background) => {
    const { calls, system } = noting("kept");
    const clipboard = chooseClipboard(background, system);
    await clipboard.writeText("kept");
    for (const value of [12, ["a text in a list"], undefined, null]) await clipboard.writeText(value as unknown as string);
    expect(await clipboard.readText()).toBe("kept");
    expect(calls.filter((call) => call.startsWith("write"))).toEqual(background ? [] : ["write kept"]);
  });
});

describe("pastedImage", () => {
  const BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
  const NOW = Date.UTC(2026, 10, 26, 9, 15, 0, 123);
  const DAY = 24 * 60 * 60_000;
  /** The temporary folders the cases made, each the system's temporary folder of one case. */
  const made: string[] = [];
  afterEach(() => {
    for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
  });
  /** The folder the pasted images go into, inside a temporary folder of the case's own. */
  function folder(): string {
    const dir = mkdtempSync(join(tmpdir(), "owlery-pasted-case-"));
    made.push(dir);
    return join(dir, "owlery-pasted");
  }

  it("writes the clipboard's image as a PNG file named for the time, in a folder and a file the person alone reads, and answers the file's path (scenario D1)", async () => {
    const into = folder();
    const path = await pastedImage(chooseClipboard(false, noting("", BYTES).system), into, NOW);
    expect(path).toBe(join(into, `pasted-${NOW}.png`));
    expect(new Uint8Array(readFileSync(path ?? ""))).toEqual(BYTES);
    expect(statSync(into).mode & 0o777).toBe(0o700);
    expect(statSync(path ?? "").mode & 0o777).toBe(0o600);
  });

  it("takes the folder back to the person alone where it stood readable by others", async () => {
    const into = folder();
    mkdirSync(into, { mode: 0o755 });
    await pastedImage(chooseClipboard(false, noting("", BYTES).system), into, NOW);
    expect(statSync(into).mode & 0o777).toBe(0o700);
  });

  it(`removes the folder's files older than ${PASTED_DAYS} days at each write, and keeps the younger ones (scenario D3)`, async () => {
    const into = folder();
    mkdirSync(into, { mode: 0o700 });
    const old = join(into, "pasted-old.png");
    const young = join(into, "pasted-young.png");
    for (const [file, age] of [
      [old, 8 * DAY],
      [young, DAY],
    ] as const) {
      writeFileSync(file, "");
      utimesSync(file, (NOW - age) / 1000, (NOW - age) / 1000);
    }
    expect(PASTED_DAYS).toBe(7);
    await pastedImage(chooseClipboard(false, noting("", BYTES).system), into, NOW);
    expect(readdirSync(into).sort()).toEqual([`pasted-${NOW}.png`, "pasted-young.png"]);
  });

  it("writes nothing, and makes no folder, where the clipboard holds no image, and in the background whatever the system's holds (scenario D4)", async () => {
    const into = folder();
    expect(await pastedImage(chooseClipboard(false, noting("a text").system), into, NOW)).toBeNull();
    const background = noting("", BYTES);
    expect(await pastedImage(chooseClipboard(true, background.system), into, NOW)).toBeNull();
    expect(background.calls).toEqual([]);
    expect(existsSync(into)).toBe(false);
  });
});
