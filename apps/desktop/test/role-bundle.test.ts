// The role bundle: the plugin folder the app ships, which a role session
// loads for itself alone. Its files are taken from AgenticSeal, and the
// bundle's README.md says at which release and with which changes.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PLUGIN_NAME, roleDocuments } from "../src/daemon/adapters/claude-roles";
import { ROLE_STAGES } from "../src/shared/protocol";
import { buildApp } from "./built-app";

const APP_DIR = join(__dirname, "..");
const BUNDLE = join(APP_DIR, "role-bundle");

/** Every file under a folder, by its path from the folder, sorted. */
function filesOf(folder: string): string[] {
  const found: string[] = [];
  const walk = (at: string): void => {
    for (const name of readdirSync(at)) {
      const path = join(at, name);
      if (statSync(path).isDirectory()) walk(path);
      else found.push(relative(folder, path));
    }
  };
  walk(folder);
  return found.sort();
}

/** The frontmatter of a document, the lines between its two `---` lines; nothing where it opens with none. */
function frontmatterOf(text: string): string {
  return /^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] ?? "";
}

describe("the role bundle", () => {
  const read = (path: string): string => readFileSync(join(BUNDLE, path), "utf8");

  it("is a plugin named owlery, whose manifest states no version and no hook", () => {
    const manifest = JSON.parse(read(".claude-plugin/plugin.json")) as Record<string, unknown>;
    expect(manifest.name).toBe("owlery");
    expect(PLUGIN_NAME).toBe("owlery");
    expect(Object.keys(manifest).sort()).toEqual(["description", "name"]);
  });

  it("holds the definition of each role a session can be launched as, and every document the adapter appends for its stage", () => {
    expect(ROLE_STAGES.map(({ role }) => role)).toEqual(["proofer", "crafter", "sealer"]);
    for (const pair of ROLE_STAGES) {
      expect(frontmatterOf(read(`agents/${pair.role}.md`)), pair.role).toContain(`name: ${pair.role}\n`);
      const documents = roleDocuments(pair);
      expect(documents.length, pair.role).toBeGreaterThanOrEqual(2);
      for (const document of documents) expect(existsSync(join(BUNDLE, document)), `${pair.role}: ${document}`).toBe(true);
    }
  });

  it("holds the 15 documents taken from AgenticSeal, its licence, the notice and the manifest, and no other file", () => {
    expect(filesOf(BUNDLE)).toEqual(
      [
        ".claude-plugin/plugin.json",
        "LICENSE",
        "README.md",
        "agents/crafter.md",
        "agents/proofer.md",
        "agents/sealer.md",
        "docs/forms/the-guarantee.md",
        "docs/forms/the-round-record.md",
        "skills/agent-contract/SKILL.md",
        "skills/code-review/SKILL.md",
        "skills/core/SKILL.md",
        "skills/implement/SKILL.md",
        "skills/implement/fix-pass.md",
        "skills/verify/SKILL.md",
        "skills/writing-style/SKILL.md",
        "templates/records/sdd-gaps.md",
        "templates/records/sdd-guarantee.md",
        "templates/records/sdd-round.md",
      ].sort(),
    );
  });

  it("keeps AgenticSeal's licence text beside the files, and its notice names the source, the release and the licence", () => {
    const licence = read("LICENSE");
    expect(licence.startsWith("MIT License\n")).toBe(true);
    expect(licence).toContain("\nCopyright (c) 2026 AgenticSeal contributors\n");
    expect(licence).toContain("Permission is hereby granted, free of charge, to any person obtaining a copy");
    expect(licence).toContain("The above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.");
    const notice = read("README.md");
    for (const named of ["AgenticSeal", "https://github.com/MichaelYcJo/AgenticSeal", "v0.38.4", "MIT License", "`LICENSE`"]) expect(notice, named).toContain(named);
  });

  it("holds no hook of a session a person watches: no hooks folder, no hooks.json, and no hooks key in the manifest", () => {
    const files = filesOf(BUNDLE);
    expect(files.filter((file) => file.split("/").includes("hooks"))).toEqual([]);
    expect(files.filter((file) => file.endsWith("hooks.json"))).toEqual([]);
    expect(Object.keys(JSON.parse(read(".claude-plugin/plugin.json")) as object)).not.toContain("hooks");
  });

  it("leaves the rules to the file the daemon appends: no definition's frontmatter holds a skills key", () => {
    for (const { role } of ROLE_STAGES) {
      const frontmatter = frontmatterOf(read(`agents/${role}.md`));
      expect(frontmatter, role).not.toBe("");
      expect(frontmatter, role).not.toMatch(/^skills:/m);
    }
  });

  it("has the sealer queue and draw no stamp", () => {
    expect(read("agents/sealer.md")).not.toMatch(/stamp/i);
  });

  it("holds no script, no library and no drawing: every file under the four taken folders is a document", () => {
    const taken = filesOf(BUNDLE).filter((file) => /^(agents|skills|docs|templates)\//.test(file));
    expect(taken.filter((file) => !file.endsWith(".md"))).toEqual([]);
    expect(filesOf(BUNDLE).filter((file) => /^(lib|bin|scripts)\//.test(file))).toEqual([]);
  });
});

describe("the built app's role bundle", () => {
  beforeAll(() => buildApp(), 60_000);

  it("is the bundle of the tree at dist/bundle, each file with the same bytes and no file more", () => {
    const built = join(APP_DIR, "dist", "bundle");
    const files = filesOf(BUNDLE);
    expect(filesOf(built)).toEqual(files);
    for (const file of files) expect(readFileSync(join(built, file)).equals(readFileSync(join(BUNDLE, file))), file).toBe(true);
  });
});
