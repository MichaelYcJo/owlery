// layer: logic
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { editorChoice, readEditor, writeEditor } from "../src/main/editor";

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

/** A folder that stands in for the app's user data folder. */
function userData(): string {
  const dir = mkdtempSync(join(tmpdir(), "owlery-user-data-"));
  cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

describe("editorChoice", () => {
  it("reads each editor of the list, and Finder, as the choice it names", () => {
    for (const name of ["Visual Studio Code", "Cursor", "Zed", "Sublime Text", "Xcode", "finder"]) expect(editorChoice(name)).toBe(name);
  });

  it("reads anything else as no choice: a terminal of the list, an app of no list, and what is no name", () => {
    for (const value of ["Terminal", "Notes", "/Applications/Zed.app", "zed", "", undefined, null, 7, ["Zed"]]) expect([value, editorChoice(value)]).toEqual([value, null]);
  });
});

describe("readEditor and writeEditor", () => {
  it("reads no choice where no file stands, and where the file is no JSON or names no editor of the list (scenario C3)", () => {
    const dir = userData();
    expect(readEditor(dir)).toBeNull();
    writeFileSync(join(dir, "editor.json"), "{ not json");
    expect(readEditor(dir)).toBeNull();
    writeFileSync(join(dir, "editor.json"), JSON.stringify({ editor: "Notes" }));
    expect(readEditor(dir)).toBeNull();
  });

  it("keeps an editor of the list, or Finder, in `editor.json`, readable by the person alone, and reads it back (scenario C3)", () => {
    const dir = userData();
    expect(writeEditor(dir, "Zed")).toBe(true);
    expect(JSON.parse(readFileSync(join(dir, "editor.json"), "utf8"))).toEqual({ editor: "Zed" });
    expect(statSync(join(dir, "editor.json")).mode & 0o777).toBe(0o600);
    expect(readEditor(dir)).toBe("Zed");
    expect(writeEditor(dir, "finder")).toBe(true);
    expect(readEditor(dir)).toBe("finder");
  });

  it("keeps no value that is no editor of the list and not Finder, and leaves the choice kept before", () => {
    const dir = userData();
    writeEditor(dir, "Xcode");
    for (const value of ["Terminal", "Notes", null, 7]) expect(writeEditor(dir, value)).toBe(false);
    expect(readEditor(dir)).toBe("Xcode");
  });
});
