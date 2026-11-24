// The daemon's read of a file a person's repository holds: a plain file of a
// bounded size, and never what a link, a pipe or a device stands for.
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { REPOSITORY_FILE_BYTES, repositoryFileText } from "../src/daemon/repository-file";

describe("the read of a file of a person's repository", () => {
  const cleanups: (() => void)[] = [];
  afterEach(() => {
    for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  });
  const folder = (): string => {
    const made = realpathSync(mkdtempSync(join(tmpdir(), "owlery-repository-file-")));
    cleanups.push(() => rmSync(made, { recursive: true, force: true }));
    return made;
  };

  it("gives a plain file's text, and null where nothing stands at the path", () => {
    const dir = folder();
    writeFileSync(join(dir, "decisions.md"), "결정 하나.\n");
    expect(repositoryFileText(join(dir, "decisions.md"))).toBe("결정 하나.\n");
    expect(repositoryFileText(join(dir, "none.md"))).toBeNull();
    expect(repositoryFileText(join(dir, "none.md"), "followed")).toBeNull();
  });

  it("refuses a link, to a file and to nothing alike, with a sentence that names the file, and reads through one only where the caller says a link is followed", () => {
    const dir = folder();
    writeFileSync(join(dir, "outside.md"), "Read through a link.\n");
    symlinkSync(join(dir, "outside.md"), join(dir, "decisions.md"));
    symlinkSync(join(dir, "no-such-file"), join(dir, "routing.md"));
    expect(() => repositoryFileText(join(dir, "decisions.md"))).toThrow("decisions.md is a link, and Owlery reads it only as a file of its own");
    // A link that leads nowhere is not a path where nothing stands: a write there would replace the link.
    expect(() => repositoryFileText(join(dir, "routing.md"))).toThrow("routing.md is a link, and Owlery reads it only as a file of its own");
    expect(repositoryFileText(join(dir, "decisions.md"), "followed")).toBe("Read through a link.\n");
    expect(repositoryFileText(join(dir, "routing.md"), "followed")).toBeNull();
  });

  it("refuses what is not a plain file, a folder and what a followed link leads to among it", () => {
    const dir = folder();
    mkdirSync(join(dir, "decisions.md"));
    symlinkSync(join(dir, "decisions.md"), join(dir, "README.md"));
    expect(() => repositoryFileText(join(dir, "decisions.md"))).toThrow("decisions.md is not a plain file");
    expect(() => repositoryFileText(join(dir, "README.md"), "followed")).toThrow("README.md is not a plain file");
  });

  it("does not wait on a pipe that nobody writes to", () => {
    const dir = folder();
    const pipe = join(dir, "decisions.md");
    execFileSync("mkfifo", [pipe]);
    // An open that waits for a writer ends when this one opens the pipe, two seconds on, so a read that waits fails the case and does not hold it.
    const opener = spawn("/bin/sh", ["-c", 'sleep 2; exec 3<>"$1"', "sh", pipe], { stdio: "ignore" });
    cleanups.push(() => opener.kill());
    const before = Date.now();
    expect(() => repositoryFileText(pipe)).toThrow("decisions.md is not a plain file");
    expect(Date.now() - before).toBeLessThan(1000);
  });

  it(`reads a file of ${String(REPOSITORY_FILE_BYTES)} bytes whole, and refuses one of a byte more with both counts`, () => {
    const dir = folder();
    writeFileSync(join(dir, "decisions.md"), "a".repeat(REPOSITORY_FILE_BYTES));
    writeFileSync(join(dir, "routing.md"), "a".repeat(REPOSITORY_FILE_BYTES + 1));
    expect(repositoryFileText(join(dir, "decisions.md"))).toBe(readFileSync(join(dir, "decisions.md"), "utf8"));
    expect(() => repositoryFileText(join(dir, "routing.md"))).toThrow(`routing.md holds ${String(REPOSITORY_FILE_BYTES + 1)} bytes, and Owlery reads at most ${String(REPOSITORY_FILE_BYTES)} of such a file`);
    expect(() => repositoryFileText(join(dir, "routing.md"), "followed")).toThrow("routing.md holds");
  });
});
