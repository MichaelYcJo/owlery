// The Owl Chain as data: the role bundle's workflow file and inspector
// module, which the daemon and the chain command read each stage's content
// from, the loader's refusal of a file that does not hold to the skeleton or
// to the form, and the build's step that names a stage's model in its agent's
// definition. Each case that changes a file changes a copy of the bundle in a
// temporary folder.
import { cpSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ROLE_STAGES } from "../src/shared/protocol";
import { OWL_CHAIN, SKELETON, loadWorkflow, stageFor, withModel, writeDefinitionModels } from "../src/daemon/workflow";

const BUNDLE = join(__dirname, "..", "role-bundle");
const WORKFLOW = join("workflows", "owl-chain.json");
const MODULE = join("inspectors", "owl-chain.json");

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

/** A copy of the tree's role bundle in a temporary folder of the case's own. */
function bundleCopy(): string {
  const folder = realpathSync(mkdtempSync(join(tmpdir(), "owlery-workflow-")));
  cleanups.push(() => rmSync(folder, { recursive: true, force: true }));
  const bundle = join(folder, "bundle");
  cpSync(BUNDLE, bundle, { recursive: true });
  return bundle;
}

/** Rewrites one of a bundle's two files as `change` returns it, given the file as JSON. */
function rewrite(bundle: string, file: string, change: (json: Record<string, unknown>) => unknown): void {
  const json = JSON.parse(readFileSync(join(bundle, file), "utf8")) as Record<string, unknown>;
  writeFileSync(join(bundle, file), `${JSON.stringify(change(json), null, 2)}\n`);
}

/** A copy of a stage's JSON with `changed` laid over it. */
const stage = (json: Record<string, unknown>, kind: string, changed: object): Record<string, unknown> => ({ ...json, stages: { ...(json.stages as object), [kind]: { ...((json.stages as Record<string, object>)[kind] ?? {}), ...changed } } });

describe("the Owl Chain's workflow", () => {
  it("reads from the bundle's two files each pair of the protocol as a stage: its agent's definition and the agent's name, the documents its launch carries after the two of every role, its provider, and its model, the inspector on opus and every other stage on the CLI's default; and the module's one check and record", () => {
    const workflow = loadWorkflow(BUNDLE);
    expect([workflow.workflow, workflow.skeleton, workflow.inspector]).toEqual([OWL_CHAIN, SKELETON, OWL_CHAIN]);
    expect([OWL_CHAIN, SKELETON]).toEqual(["owl-chain", "rounds-then-inspection"]);
    expect(ROLE_STAGES.map((pair) => stageFor(workflow, pair))).toEqual([
      { pair: { role: "proofer", stage: "round" }, agent: "agents/proofer.md", agentName: "proofer", documents: ["skills/code-review/SKILL.md"], provider: "claude", model: null },
      { pair: { role: "crafter", stage: "fix-pass" }, agent: "agents/crafter.md", agentName: "crafter", documents: ["skills/implement/SKILL.md", "skills/implement/fix-pass.md"], provider: "claude", model: null },
      { pair: { role: "inspector", stage: "inspection" }, agent: "agents/inspector.md", agentName: "inspector", documents: [], provider: "claude", model: "opus" },
      { pair: { role: "orchestrator", stage: "judgment" }, agent: "agents/orchestrator.md", agentName: "orchestrator", documents: ["docs/forms/the-round-record.md"], provider: "claude", model: null },
    ]);
    expect(workflow.checks).toEqual([{ name: "broad gate", command: { config: "Broad gate" } }]);
    expect(workflow.record).toBe("templates/records/sdd-inspection.md");
  });

  it("refuses a workflow file that names a stage its skeleton does not hold, lacks one it holds, or names another skeleton or another inspector module, naming the file and the key", () => {
    const file = (bundle: string) => join(bundle, WORKFLOW);
    const cases: [(json: Record<string, unknown>) => unknown, (bundle: string) => string][] = [
      [(json) => ({ ...json, stages: { ...(json.stages as object), review: (json.stages as Record<string, unknown>).round } }), (b) => `The workflow file ${file(b)} is refused at \`stages.review\`: the skeleton ${SKELETON} holds no stage review.`],
      [(json) => ({ ...json, stages: { round: (json.stages as Record<string, unknown>).round, "fix-pass": (json.stages as Record<string, unknown>)["fix-pass"] } }), (b) => `The workflow file ${file(b)} is refused at \`stages.judgment\`: it is missing, and the skeleton ${SKELETON} holds the stage judgment.`],
      [(json) => ({ ...json, skeleton: "rounds-alone" }), (b) => `The workflow file ${file(b)} is refused at \`skeleton\`: it names "rounds-alone", and the one skeleton of this version is ${SKELETON}.`],
      [(json) => ({ ...json, inspector: "another" }), (b) => `The workflow file ${file(b)} is refused at \`inspector\`: it names "another", and the one inspector module this version loads is ${OWL_CHAIN}, in ${MODULE}.`],
      [(json) => ({ ...json, workflow: "another" }), (b) => `The workflow file ${file(b)} is refused at \`workflow\`: it names "another", where the file is the workflow ${OWL_CHAIN}.`],
    ];
    for (const [change, says] of cases) {
      const bundle = bundleCopy();
      rewrite(bundle, WORKFLOW, change);
      expect(() => loadWorkflow(bundle)).toThrow(says(bundle));
    }
  });

  it("refuses a stage that does not hold to the form, naming the file and the key: a key it does not know or lacks, a role other than the one the skeleton runs the stage as, a path outside the bundle or of a file it does not hold, an agent whose definition names no agent, another provider, and a model that is neither a name nor null", () => {
    const file = (bundle: string) => join(bundle, WORKFLOW);
    const cases: [(json: Record<string, unknown>) => unknown, (bundle: string) => string][] = [
      [(json) => stage(json, "round", { modle: "opus" }), (b) => `The workflow file ${file(b)} is refused at \`stages.round.modle\`: it is no key of a stage.`],
      [(json) => ({ ...json, stages: { ...(json.stages as object), round: { role: "proofer", agent: "agents/proofer.md", documents: [], provider: "claude" } } }), (b) => `The workflow file ${file(b)} is refused at \`stages.round.model\`: it is missing.`],
      [(json) => stage(json, "round", { role: "crafter" }), (b) => `The workflow file ${file(b)} is refused at \`stages.round.role\`: it names "crafter", and the skeleton ${SKELETON} runs the stage round as the proofer.`],
      [(json) => stage(json, "round", { agent: "../agents/proofer.md" }), (b) => `The workflow file ${file(b)} is refused at \`stages.round.agent\`: "../agents/proofer.md" is no path inside the bundle.`],
      [(json) => stage(json, "round", { agent: "/agents/proofer.md" }), (b) => `The workflow file ${file(b)} is refused at \`stages.round.agent\`: "/agents/proofer.md" is no path inside the bundle.`],
      [(json) => stage(json, "fix-pass", { documents: ["skills/implement/SKILL.md", "skills/implement/gone.md"] }), (b) => `The workflow file ${file(b)} is refused at \`stages.fix-pass.documents.1\`: the bundle holds no file skills/implement/gone.md.`],
      [(json) => stage(json, "fix-pass", { documents: "skills/implement/SKILL.md" }), (b) => `The workflow file ${file(b)} is refused at \`stages.fix-pass.documents\`: it holds no list of the bundle's documents.`],
      [(json) => stage(json, "judgment", { agent: "skills/core/SKILL.md" }), (b) => `The workflow file ${file(b)} is refused at \`stages.judgment.agent\`: skills/core/SKILL.md is no definition of the bundle's agents/, where Claude Code finds a plugin's agents.`],
      [(json) => stage(json, "judgment", { agent: "agents/README.md" }), (b) => `The workflow file ${file(b)} is refused at \`stages.judgment.agent\`: agents/README.md is no agent's definition, since its frontmatter names no agent on a line \`name:\`.`],
      [(json) => stage(json, "round", { provider: "codex" }), (b) => `The workflow file ${file(b)} is refused at \`stages.round.provider\`: it names "codex", and the one provider of this version is claude.`],
      ...[3, "", "two words", "opus\nname: x"].map((model): [(json: Record<string, unknown>) => unknown, (bundle: string) => string] => [(json) => stage(json, "round", { model }), (b) => `The workflow file ${file(b)} is refused at \`stages.round.model\`: it is neither a model's name with no white space nor null.`]),
      [(json) => ({ ...json, stages: { ...(json.stages as object), round: ["proofer"] } }), (b) => `The workflow file ${file(b)} is refused at \`stages.round\`: it holds no object.`],
      [() => ["owl-chain"], (b) => `The workflow file ${file(b)} is refused at its top: it holds no object.`],
    ];
    for (const [change, says] of cases) {
      const bundle = bundleCopy();
      // A file under agents/ whose frontmatter names no agent.
      writeFileSync(join(bundle, "agents", "README.md"), "---\ndescription: no agent\n---\n\n# Not a definition\n");
      rewrite(bundle, WORKFLOW, change);
      expect(() => loadWorkflow(bundle)).toThrow(says(bundle));
    }
  });

  it("refuses an inspector module that does not hold to the form, naming the file and the key: another name, a check other than the repository's broad gate, a stage of another role, a record the bundle does not hold, and a module that does not stand", () => {
    const file = (bundle: string) => join(bundle, MODULE);
    const cases: [(json: Record<string, unknown>) => unknown, (bundle: string) => string][] = [
      [(json) => ({ ...json, inspector: "another" }), (b) => `The inspector module ${file(b)} is refused at \`inspector\`: it names "another", where the file is the module ${OWL_CHAIN}.`],
      [(json) => ({ ...json, checks: [] }), (b) => `The inspector module ${file(b)} is refused at \`checks\`: this version runs one check before the inspection, the command the repository's config.json names under "Broad gate", so the list holds that check alone, as { "name": "broad gate", "command": { "config": "Broad gate" } }.`],
      [(json) => ({ ...json, checks: [{ name: "lint", command: { config: "Lint" } }] }), (b) => `The inspector module ${file(b)} is refused at \`checks\`: this version runs one check before the inspection, the command the repository's config.json names under "Broad gate", so the list holds that check alone, as { "name": "broad gate", "command": { "config": "Broad gate" } }.`],
      [(json) => ({ ...json, stage: { ...(json.stage as object), role: "proofer" } }), (b) => `The inspector module ${file(b)} is refused at \`stage.role\`: it names "proofer", and the skeleton ${SKELETON} runs the stage inspection as the inspector.`],
      [(json) => ({ ...json, stage: { ...(json.stage as object), model: null, extra: true } }), (b) => `The inspector module ${file(b)} is refused at \`stage.extra\`: it is no key of a stage.`],
      [(json) => ({ ...json, record: "templates/records/sdd-guarantee.md" }), (b) => `The inspector module ${file(b)} is refused at \`record\`: the bundle holds no file templates/records/sdd-guarantee.md.`],
      [(json) => ({ ...json, inspectors: "owl-chain" }), (b) => `The inspector module ${file(b)} is refused at \`inspectors\`: it is no key of an inspector module.`],
    ];
    for (const [change, says] of cases) {
      const bundle = bundleCopy();
      rewrite(bundle, MODULE, change);
      expect(() => loadWorkflow(bundle)).toThrow(says(bundle));
    }
    const bundle = bundleCopy();
    rmSync(join(bundle, MODULE));
    expect(() => loadWorkflow(bundle)).toThrow(`The workflow file ${join(bundle, WORKFLOW)} is refused at \`inspector\`: it names "${OWL_CHAIN}", and the bundle holds no module ${MODULE}.`);
  });

  it("refuses a file it cannot read or that holds no JSON, naming the file", () => {
    const gone = bundleCopy();
    rmSync(join(gone, WORKFLOW));
    expect(() => loadWorkflow(gone)).toThrow(`The workflow file ${join(gone, WORKFLOW)} cannot be read: `);
    const broken = bundleCopy();
    writeFileSync(join(broken, MODULE), "{ not json\n");
    expect(() => loadWorkflow(broken)).toThrow(`The inspector module ${join(broken, MODULE)} holds no JSON: `);
  });
});

describe("the build's model of a stage in its agent's definition", () => {
  it("writes into the frontmatter of each stage's definition that names a model the line `model:` with that model, as the frontmatter's last line, and leaves every other definition as it is", () => {
    const bundle = bundleCopy();
    const before = Object.fromEntries(ROLE_STAGES.map(({ role }) => [role, readFileSync(join(bundle, "agents", `${role}.md`), "utf8")]));
    expect(writeDefinitionModels(bundle)).toEqual(["agents/inspector.md"]);
    for (const { role } of ROLE_STAGES) {
      const after = readFileSync(join(bundle, "agents", `${role}.md`), "utf8");
      if (role !== "inspector") expect(after, role).toBe(before[role]);
    }
    const inspector = before.inspector ?? "";
    const end = inspector.indexOf("\n---\n", 4);
    expect(readFileSync(join(bundle, "agents", "inspector.md"), "utf8")).toBe(`${inspector.slice(0, end)}\nmodel: opus${inspector.slice(end)}`);
  });

  it("writes the model a stage's file names, and nothing where it names null", () => {
    const bundle = bundleCopy();
    rewrite(bundle, WORKFLOW, (json) => stage(json, "round", { model: "sonnet" }));
    rewrite(bundle, MODULE, (json) => ({ ...json, stage: { ...(json.stage as object), model: null } }));
    const inspector = readFileSync(join(bundle, "agents", "inspector.md"), "utf8");
    expect(writeDefinitionModels(bundle)).toEqual(["agents/proofer.md"]);
    expect(readFileSync(join(bundle, "agents", "proofer.md"), "utf8")).toContain("\ntools: Read, Glob, Grep, Bash\nmodel: sonnet\n---\n");
    expect(readFileSync(join(bundle, "agents", "inspector.md"), "utf8")).toBe(inspector);
  });

  it("refuses a definition that names a model of its own, or opens with no frontmatter, since a stage's model stands in its workflow's file or its module's alone", () => {
    expect(() => withModel("---\nname: inspector\nmodel: opus\n---\n\n# inspector\n", "opus", "agents/inspector.md")).toThrow("The agent definition agents/inspector.md names a model of its own, and a stage's model stands in its workflow's file or its inspector module's alone.");
    expect(() => withModel("# inspector\n", "opus", "agents/inspector.md")).toThrow("The agent definition agents/inspector.md opens with no frontmatter, so the build has nowhere to write its stage's model.");
    expect(withModel("---\nname: inspector\ntools: Read\n---\n\n# inspector\n\n---\nmodel: a rule's own line\n", "opus", "agents/inspector.md")).toBe("---\nname: inspector\ntools: Read\nmodel: opus\n---\n\n# inspector\n\n---\nmodel: a rule's own line\n");
  });

  it("refuses to build a bundle whose workflow the loader refuses, naming the file and the key", () => {
    const bundle = bundleCopy();
    rewrite(bundle, WORKFLOW, (json) => ({ ...json, skeleton: "rounds-alone" }));
    expect(() => writeDefinitionModels(bundle)).toThrow(`The workflow file ${join(bundle, WORKFLOW)} is refused at \`skeleton\`: `);
  });
});
