// layer: process
// The layer line each test file opens with, and the guards that hold it. The
// configuration reads the line through `scripts/layers.mjs#filesByLayer`, and
// the guards' cases run the configuration's own projects, through
// `vitest.config.mts#projectsOf`, over a folder of fixture files in a vitest
// of their own, and read what each fixture case did from its JSON report.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { filesByLayer, LAYERS, layerOf } from "../scripts/layers.mjs";

const APP_DIR = join(__dirname, "..");
const VITEST = join(APP_DIR, "node_modules", "vitest", "vitest.mjs");
const STARTERS = ["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork"];

const cleanups: (() => void)[] = [];
afterAll(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

/** A temporary folder that stands for an app's folder, with the files given written under it. */
function appFolder(files: Record<string, string>): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "owlery-layers-")));
  cleanups.push(() => rmSync(root, { recursive: true, force: true }));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

describe("the layer line", () => {
  it("is read in one spelling, `// layer: ` and one of the four names, and in no other", () => {
    for (const layer of LAYERS) expect(layerOf(`// layer: ${layer}`)).toBe(layer);
    expect(LAYERS).toEqual(["logic", "process", "pty", "app"]);
    for (const line of ["//layer: logic", "// layer:logic", "// layer: Logic", "// Layer: pty", "// layer: logic ", " // layer: logic", "// layer: unit", "// layer: logic\r", "/* layer: logic */", "// layer: app, pty", ""]) expect(layerOf(line)).toBeNull();
  });

  it("puts each test file of the folder `test` in the layer its first line names, in its subfolders too, and reads no file that is no test file", () => {
    const root = appFolder({
      "test/a.test.ts": "// layer: logic\nimport {} from 'vitest';\n",
      "test/b.test.ts": "// layer: app\n",
      "test/c.test.ts": "// layer: process\n// layer: app\n",
      "test/inner/d.test.ts": "// layer: pty\n",
      "test/helper.ts": "export {};\n",
      "test/fixtures/stand-in": "#!/bin/sh\n",
    });
    expect(filesByLayer(root)).toEqual({ logic: ["test/a.test.ts"], process: ["test/c.test.ts"], pty: ["test/inner/d.test.ts"], app: ["test/b.test.ts"] });
  });

  it("stops, naming each test file whose first line is no layer line and the four lines it reads", () => {
    const root = appFolder({
      "test/named.test.ts": "// layer: logic\n",
      "test/second.test.ts": "// What these cases hold.\n// layer: logic\n",
      "test/empty.test.ts": "",
      "test/inner/unit.test.ts": "// layer: unit\n",
    });
    let message = "";
    try {
      filesByLayer(root);
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toBe(
      "These test files open with no layer line: test/empty.test.ts, test/inner/unit.test.ts, test/second.test.ts. A test file's first line names its layer, and is one of `// layer: logic`, `// layer: process`, `// layer: pty` and `// layer: app`. scripts/layers.mjs says what a case of each layer may do.",
    );
  });
});

/** What one case of a fixture file did, as the fixture run's JSON report gives it. */
type Ran = { status: string; failureMessages: string[] };

describe("the guards of the layers", () => {
  /** Each fixture case by its title. */
  const ran = new Map<string, Ran>();
  /** What the fixture run printed, for a case whose fixture did not run. */
  let printed = "";

  beforeAll(() => {
    const builtApp = JSON.stringify(join(APP_DIR, "test", "built-app"));
    const root = appFolder({
      // A package of the fixture's own, which vitest leaves to Node to load, as it does each package of `node_modules`.
      "node_modules/starts-a-process/package.json": JSON.stringify({ name: "starts-a-process", type: "module", exports: "./index.js" }),
      "node_modules/starts-a-process/index.js": 'import { execFileSync } from "node:child_process";\nexport const run = () => execFileSync("/usr/bin/true");\n',
      "test/logic.test.ts": [
        "// layer: logic",
        'import * as imported from "node:child_process";',
        'import { createRequire } from "node:module";',
        'import { spawn as spawnPty } from "node-pty";',
        'import { run } from "starts-a-process";',
        'import { it } from "vitest";',
        `import { buildApp } from ${builtApp};`,
        'const required = createRequire(import.meta.url)("node:child_process");',
        `for (const name of ${JSON.stringify(STARTERS)}) {`,
        '  it(`imported ${name}`, () => { imported[name]("/usr/bin/true", [], () => {}); });',
        '  it(`required ${name}`, () => { required[name]("/usr/bin/true", [], () => {}); });',
        "}",
        'it("a package Node loads", () => { run(); });',
        'it("logic: a pty", () => { spawnPty("/bin/echo", [], {}); });',
        'it("logic: the built app", () => { buildApp(); });',
        "",
      ].join("\n"),
      "test/process.test.ts": [
        "// layer: process",
        'import { execFileSync } from "node:child_process";',
        'import { spawn as spawnPty } from "node-pty";',
        'import { expect, it } from "vitest";',
        `import { buildApp } from ${builtApp};`,
        'it("process: git", () => { expect(execFileSync("git", ["--version"], { encoding: "utf8" })).toMatch(/^git version /); });',
        'it("process: a pty", () => { spawnPty("/bin/echo", [], {}); });',
        'it("process: the built app", () => { buildApp(); });',
        "",
      ].join("\n"),
      "test/pty.test.ts": [
        "// layer: pty",
        'import { it } from "vitest";',
        `import { BuiltApp, buildApp } from ${builtApp};`,
        'it("pty: the built app", () => { buildApp(); });',
        // A start the guard does not stop fails at once on the folder it is to write, so no app starts.
        'it("pty: a start of the built app", async () => { await BuiltApp.start({}, { writeRun: () => { throw new Error("the start went on"); } }); });',
        "",
      ].join("\n"),
    });
    // The configuration names the folder it reads, whose name is known once it stands.
    writeFileSync(join(root, "vitest.config.mts"), `import { defineConfig } from "vitest/config";\nimport { projectsOf } from ${JSON.stringify(join(APP_DIR, "vitest.config.mts"))};\nexport default defineConfig({ test: { projects: projectsOf(${JSON.stringify(root)}) } });\n`);
    // The packages the configuration and the fixture files import are the app's.
    for (const name of ["vitest", "node-pty"]) symlinkSync(join(APP_DIR, "node_modules", name), join(root, "node_modules", name));
    // The fixture run is a vitest of its own, so it is given none of the variables this run's vitest set for its worker.
    const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith("VITEST") && name !== "OWLERY_TEST_LAYER" && name !== "NODE_ENV" && name !== "TEST"));
    const report = join(root, "report.json");
    const run = spawnSync(process.execPath, [VITEST, "run", "--reporter=json", `--outputFile=${report}`], { cwd: root, env: { ...env, ELECTRON_RUN_AS_NODE: "1" }, encoding: "utf8", timeout: 60_000 });
    printed = `${run.stdout}\n${run.stderr}`;
    const results = (JSON.parse(readFileSync(report, "utf8")) as { testResults: { assertionResults: ({ title: string } & Ran)[] }[] }).testResults;
    for (const { assertionResults } of results) for (const { title, status, failureMessages } of assertionResults) ran.set(title, { status, failureMessages });
  }, 60_000);

  /** The case of that title, which has to have failed, and the first line of its failure. */
  function failure(title: string): string {
    const one = ran.get(title);
    expect(one, `the fixture run printed:\n${printed}`).toBeDefined();
    expect(one?.status, title).toBe("failed");
    return one?.failureMessages[0]?.split("\n")[0] ?? "";
  }

  it("makes each starter of `node:child_process` throw in a case of a `logic` file, imported, required or reached through a package Node loads, with the sentence that names `process`", () => {
    for (const name of STARTERS) {
      for (const how of ["imported", "required"]) expect(failure(`${how} ${name}`)).toBe(`Error: A case of a \`logic\` file started a process with ${name}. A file whose cases start git or another process opens with \`// layer: process\`.`);
    }
    expect(failure("a package Node loads")).toBe("Error: A case of a `logic` file started a process with execFileSync. A file whose cases start git or another process opens with `// layer: process`.");
  });

  it("lets a case of a `process` file start git, and makes node-pty's `spawn` throw in a case of a `logic` or a `process` file with the sentence that names `pty`", () => {
    expect(ran.get("process: git")?.status, printed).toBe("passed");
    for (const layer of ["logic", "process"]) expect(failure(`${layer}: a pty`)).toBe(`Error: A case of a \`${layer}\` file started a pty. A file whose cases start a Daemon, a pane or a pty opens with \`// layer: pty\`.`);
  });

  it("makes `buildApp` and `BuiltApp.start` throw in a case of any layer but `app`, with the sentence that names `app`", () => {
    for (const layer of ["logic", "process", "pty"]) expect(failure(`${layer}: the built app`)).toBe(`Error: A case of a \`${layer}\` file started the built app with buildApp. A file whose cases start the built app opens with \`// layer: app\`.`);
    expect(failure("pty: a start of the built app")).toBe("Error: A case of a `pty` file started the built app with BuiltApp.start. A file whose cases start the built app opens with `// layer: app`.");
  });
});
