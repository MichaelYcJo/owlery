import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { chooseOpener, type Opener, openLink, takeOpener } from "../src/main/links";

/** An opener that notes what it was handed and answers `opened`. No case opens the system's browser. */
function noting(opened = true): { handed: string[]; opener: Opener } {
  const handed: string[] = [];
  return {
    handed,
    opener: async (address) => {
      handed.push(address);
      return opened;
    },
  };
}

describe("openLink", () => {
  it.each([
    ["an http address", "http://example.com/a?b=1#c"],
    ["an https address", "https://example.com/owlery"],
  ])("hands %s to the opener, and answers that it opened", async (_name, address) => {
    const { handed, opener } = noting();
    expect(await openLink(address, opener)).toBe(true);
    expect(handed).toEqual([address]);
  });

  it("hands the opener the address as the URL's parser writes it", async () => {
    const { handed, opener } = noting();
    expect(await openLink("HTTPS://Example.com/a b", opener)).toBe(true);
    expect(handed).toEqual(["https://example.com/a%20b"]);
  });

  it("answers that nothing opened where the opener opened nothing", async () => {
    expect(await openLink("https://example.com/", noting(false).opener)).toBe(false);
  });

  it.each([
    ["a file's address", "file:///etc/passwd"],
    ["a script", "javascript:alert(1)"],
    ["an address of another program", "vscode://file/etc/passwd"],
    ["a text that is no URL", "example.com/owlery"],
    ["a file's path", "/Applications/Calculator.app"],
    ["an empty text", ""],
    ["a value that is no text and reads as an address", ["https://example.com/"]],
    ["no value", undefined],
  ])("refuses %s, and calls no opener", async (_name, address) => {
    const { handed, opener } = noting();
    expect(await openLink(address, opener)).toBe(false);
    expect(handed).toEqual([]);
  });
});

describe("chooseOpener", () => {
  const folder = mkdtempSync(join(tmpdir(), "owlery-links-"));
  const opened = join(folder, "opened");
  // A program that writes each argument it was started with on a line of its own.
  const program = join(folder, "opener.sh");
  writeFileSync(program, `#!/bin/sh\nprintf '%s\\n' "$@" > '${opened}'\n`);
  chmodSync(program, 0o755);

  afterAll(() => rmSync(folder, { recursive: true, force: true }));

  it("runs the program named with the address as its one argument, in the background too, and never the system's opener", async () => {
    const system = noting();
    // An address a shell would read as two commands: the program is run without one.
    const address = "https://example.com/a?b=$(id)&c=1;echo";
    expect(await chooseOpener(program, true, system.opener)(address)).toBe(true);
    expect(readFileSync(opened, "utf8")).toBe(`${address}\n`);
    expect(system.handed).toEqual([]);
  });

  it("answers that nothing opened where the program named cannot be run, and does not fall back on the system's opener", async () => {
    const system = noting();
    expect(await chooseOpener(join(folder, "no-such-program"), false, system.opener)("https://example.com/")).toBe(false);
    expect(system.handed).toEqual([]);
  });

  it("opens nothing in the background where no program is named", async () => {
    const system = noting();
    rmSync(opened, { force: true });
    expect(await chooseOpener(null, true, system.opener)("https://example.com/")).toBe(false);
    expect(system.handed).toEqual([]);
    expect(existsSync(opened)).toBe(false);
  });

  it("calls the system's opener where no program is named and the app is not in the background", async () => {
    const system = noting();
    expect(await chooseOpener(null, false, system.opener)("https://example.com/")).toBe(true);
    expect(system.handed).toEqual(["https://example.com/"]);
    expect(await chooseOpener(null, false, noting(false).opener)("https://example.com/")).toBe(false);
  });
});

describe("takeOpener", () => {
  it("answers with the program the variable names and leaves the environment without the variable", () => {
    const env: NodeJS.ProcessEnv = { OWLERY_OPENER: "/usr/local/bin/note-url", HOME: "/Users/x" };
    expect(takeOpener(env)).toBe("/usr/local/bin/note-url");
    expect(env).toEqual({ HOME: "/Users/x" });
  });

  it("answers that none is named without the variable, and with the variable empty, which it takes out", () => {
    expect(takeOpener({ HOME: "/Users/x" })).toBeNull();
    const env: NodeJS.ProcessEnv = { OWLERY_OPENER: "", HOME: "/Users/x" };
    expect(takeOpener(env)).toBeNull();
    expect(env).toEqual({ HOME: "/Users/x" });
  });
});
