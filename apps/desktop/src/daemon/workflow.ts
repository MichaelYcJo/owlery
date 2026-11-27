// The workflow a chain runs, read as data from the role bundle: the workflow
// file `workflows/owl-chain.json`, which names a skeleton, the content of each
// of the skeleton's session stages and an inspector module, and the module's
// file `inspectors/owl-chain.json`, which names the checks Owlery runs before
// the inspection, the inspector's own stage and the record it answers with.
// A stage's content is the role it runs as, its agent's definition, the
// documents its launch carries after the two of every role, the provider,
// which is the adapter's name, and its model, where null is the CLI's own
// default. Each path is read from the bundle's root.
//
// What stays code: the skeleton, which is the order (`chain.ts#stepOwed`
// for `rounds-then-inspection`) and the pairs of the protocol it runs
// (`shared/protocol.ts#ROLE_STAGES`), and each pair's grant
// (`role-grants.ts`), which no file states or widens. This version loads the
// two files of the Owl Chain and no other, so the name `owl-chain` that a
// verdict block's `workflow:` and `inspector:` lines write is the name the
// loader loads by, and it refuses a file that names itself otherwise.
//
// The daemon loads the workflow at its start, so a file the loader refuses
// stops the start with the file and the key named, and again at each role
// launch, as it reads the bundle's documents again (`adapters/claude.ts`).
// The chain command loads it where it hands a stage, and the build loads the
// built bundle's copy to name each stage's model in its agent's definition
// (`writeDefinitionModels`).
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { isAbsolute, join, normalize, sep } from "node:path";
import type { RoleStage } from "../shared/protocol";
import { BROAD_GATE_NAME } from "./machine-turns";
import { type PairKey, pairKey } from "./role-grants";

/** The name of the Owl Chain as a workflow and as an inspector module, which a verdict block's `workflow:` and `inspector:` lines name. The pull request check titles a block of this workflow by it (`pr-check/skills/code-review/scripts/chain_check.py#OWL_CHAIN`). */
export const OWL_CHAIN = "owl-chain";

/** The one skeleton of this version: review rounds and their fix passes, judged between them, then the broad gate and the inspection, in the order `chain.ts#stepOwed` reads from the records. */
export const SKELETON = "rounds-then-inspection";

/** The providers a stage may name, by their adapter's name: the one adapter that launches a role. */
const PROVIDERS = ["claude"] as const;

/** The pairs of the skeleton whose content the workflow file's `stages` holds, each under its stage kind, in the order the file states them. */
const WORKFLOW_PAIRS: readonly RoleStage[] = [
  { role: "proofer", stage: "round" },
  { role: "crafter", stage: "fix-pass" },
  { role: "orchestrator", stage: "judgment" },
];

/** The skeleton's pair whose content the inspector module's `stage` holds. */
const INSPECTION_PAIR: RoleStage = { role: "inspector", stage: "inspection" };

/** The keys of a stage, of a workflow file and of an inspector module, each of which the file holds, and no other. */
const STAGE_KEYS = ["role", "agent", "documents", "provider", "model"] as const;
const WORKFLOW_KEYS = ["workflow", "skeleton", "stages", "inspector"] as const;
const MODULE_KEYS = ["inspector", "checks", "stage", "record"] as const;

/** One stage as a launch reads it: the pair of the protocol it runs as, its agent's definition by its path in the bundle and the agent's name that definition states, the documents its launch carries after the two of every role, its provider, and its model, null for the CLI's default. */
export interface Stage {
  pair: RoleStage;
  agent: string;
  agentName: string;
  documents: readonly string[];
  provider: (typeof PROVIDERS)[number];
  model: string | null;
}

/** A check an inspector module names: a command the repository's `config.json` names under the key `config`. */
export interface Check {
  name: string;
  command: { config: string };
}

/** The workflow and its inspector module as one reading: their names, the skeleton, a stage for each pair of the skeleton, the module's checks and the template of the record its inspector answers with. */
export interface Workflow {
  workflow: string;
  skeleton: typeof SKELETON;
  inspector: string;
  stages: Readonly<Record<PairKey, Stage>>;
  checks: readonly Check[];
  record: string;
}

/** The one check this version runs before the inspection, which the Owl Chain's module names: the repository's broad gate (`gate.ts`). */
const BROAD_GATE_CHECK: Check = { name: "broad gate", command: { config: BROAD_GATE_NAME } };

/** A file being read: what it is, for the refusal's sentence, its path, and the bundle its paths are read from. */
interface Reading {
  what: "workflow file" | "inspector module";
  file: string;
  bundleDir: string;
}

/** Throws the refusal of a file at a key, the key written as its path of names and list positions joined by dots, or the file's top where it is empty. */
function refuse(at: Reading, key: string, reason: string): never {
  throw new Error(`The ${at.what} ${at.file} is refused at ${key === "" ? "its top" : `\`${key}\``}: ${reason}.`);
}

const message = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/** The JSON a file holds. It throws where the file cannot be read or holds no JSON. */
function jsonOf(at: Reading): unknown {
  let text: string;
  try {
    text = readFileSync(at.file, "utf8");
  } catch (error) {
    throw new Error(`The ${at.what} ${at.file} cannot be read: ${message(error)}.`);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new Error(`The ${at.what} ${at.file} holds no JSON: ${message(error)}.`);
  }
}

/**
 * The object a key holds, which holds each of `keys` and no other. `missing`
 * and `unknown` give the reason a refusal says for a key it lacks and for a
 * key it holds that is none of them.
 */
function objectAt(at: Reading, value: unknown, key: string, keys: readonly string[], why: { missing: (name: string) => string; unknown: (name: string) => string }): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) refuse(at, key, "it holds no object");
  const object = value as Record<string, unknown>;
  const path = (name: string) => (key === "" ? name : `${key}.${name}`);
  for (const name of Object.keys(object)) if (!keys.includes(name)) refuse(at, path(name), why.unknown(name));
  for (const name of keys) if (!(name in object)) refuse(at, path(name), why.missing(name));
  return object;
}

/** The reasons of a form whose keys are fixed: a missing key is missing, and another key is no key of the form. */
const formOf = (form: string) => ({ missing: () => "it is missing", unknown: () => `it is no key of ${form}` });

/** Whether a path names a file that stands. */
function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

/** The path of a file of the bundle a key names, relative to the bundle's root and inside it. */
function bundleFile(at: Reading, value: unknown, key: string): string {
  if (typeof value !== "string" || value === "") refuse(at, key, "it names no path of the bundle");
  if (isAbsolute(value) || normalize(value).split(sep).includes("..")) refuse(at, key, `${JSON.stringify(value)} is no path inside the bundle`);
  if (!isFile(join(at.bundleDir, value))) refuse(at, key, `the bundle holds no file ${value}`);
  return value;
}

/** The frontmatter of a definition, the lines between a first line `---` and the next. */
const FRONTMATTER = /^---\n([\s\S]*?)\n---\n/u;

/** The agent a definition's frontmatter names on its line `name:`, as Claude Code names an agent of a plugin's `agents/`; null where it names none. */
function agentNameOf(text: string): string | null {
  const head = FRONTMATTER.exec(text)?.[1] ?? "";
  return /^name: *(\S+) *$/mu.exec(head)?.[1] ?? null;
}

/** A stage of the file at a key, which the skeleton runs as `pair`. */
function stageAt(at: Reading, value: unknown, key: string, pair: RoleStage): Stage {
  const stage = objectAt(at, value, key, STAGE_KEYS, formOf("a stage"));
  if (stage.role !== pair.role) refuse(at, `${key}.role`, `it names ${JSON.stringify(stage.role)}, and the skeleton ${SKELETON} runs the stage ${pair.stage} as the ${pair.role}`);
  const agent = bundleFile(at, stage.agent, `${key}.agent`);
  if (!/^agents\/[^/]+\.md$/u.test(agent)) refuse(at, `${key}.agent`, `${agent} is no definition of the bundle's agents/, where Claude Code finds a plugin's agents`);
  const agentName = agentNameOf(readFileSync(join(at.bundleDir, agent), "utf8"));
  if (agentName === null) refuse(at, `${key}.agent`, `${agent} is no agent's definition, since its frontmatter names no agent on a line \`name:\``);
  if (!Array.isArray(stage.documents)) refuse(at, `${key}.documents`, "it holds no list of the bundle's documents");
  const documents = (stage.documents as unknown[]).map((document, index) => bundleFile(at, document, `${key}.documents.${String(index)}`));
  const provider = PROVIDERS.find((name) => name === stage.provider);
  if (provider === undefined) refuse(at, `${key}.provider`, `it names ${JSON.stringify(stage.provider)}, and the one provider of this version is ${PROVIDERS.join(", ")}`);
  // A model reaches a role session as one argument and a definition's frontmatter as one line, so it holds no white space.
  const model = stage.model;
  if (model !== null && (typeof model !== "string" || !/^\S+$/u.test(model))) refuse(at, `${key}.model`, "it is neither a model's name with no white space nor null");
  return { pair, agent, agentName, documents, provider, model: model as string | null };
}

/** The inspector module `inspectors/<OWL_CHAIN>.json` of a bundle: its checks, the inspector's stage and its record. */
function moduleOf(bundleDir: string): Pick<Workflow, "checks" | "record"> & { stage: Stage } {
  const at: Reading = { what: "inspector module", file: join(bundleDir, "inspectors", `${OWL_CHAIN}.json`), bundleDir };
  const top = objectAt(at, jsonOf(at), "", MODULE_KEYS, formOf("an inspector module"));
  if (top.inspector !== OWL_CHAIN) refuse(at, "inspector", `it names ${JSON.stringify(top.inspector)}, where the file is the module ${OWL_CHAIN}`);
  // The gate is code: this version runs the broad gate alone before the inspection, so a module that named another check would name one nothing runs.
  if (JSON.stringify(top.checks) !== JSON.stringify([BROAD_GATE_CHECK])) refuse(at, "checks", `this version runs one check before the inspection, the command the repository's config.json names under "${BROAD_GATE_NAME}", so the list holds that check alone, as { "name": "${BROAD_GATE_CHECK.name}", "command": { "config": "${BROAD_GATE_NAME}" } }`);
  const stage = stageAt(at, top.stage, "stage", INSPECTION_PAIR);
  const record = bundleFile(at, top.record, "record");
  return { checks: [BROAD_GATE_CHECK], stage, record };
}

/**
 * The Owl Chain's workflow, read from the bundle at `bundleDir`: its file
 * and the inspector module it names. It throws, naming the file and the key,
 * where a file cannot be read, holds no JSON, names a skeleton this version
 * does not hold, names a stage the skeleton does not hold or lacks one it
 * holds, names an inspector module other than the one it loads, or holds a
 * key or a value the form does not.
 */
export function loadWorkflow(bundleDir: string): Workflow {
  const at: Reading = { what: "workflow file", file: join(bundleDir, "workflows", `${OWL_CHAIN}.json`), bundleDir };
  const top = objectAt(at, jsonOf(at), "", WORKFLOW_KEYS, formOf("a workflow file"));
  if (top.workflow !== OWL_CHAIN) refuse(at, "workflow", `it names ${JSON.stringify(top.workflow)}, where the file is the workflow ${OWL_CHAIN}`);
  if (top.skeleton !== SKELETON) refuse(at, "skeleton", `it names ${JSON.stringify(top.skeleton)}, and the one skeleton of this version is ${SKELETON}`);
  const kinds = WORKFLOW_PAIRS.map(({ stage }) => stage);
  const stages = objectAt(at, top.stages, "stages", kinds, { missing: (kind) => `it is missing, and the skeleton ${SKELETON} holds the stage ${kind}`, unknown: (kind) => `the skeleton ${SKELETON} holds no stage ${kind}` });
  const read = WORKFLOW_PAIRS.map((pair) => stageAt(at, stages[pair.stage], `stages.${pair.stage}`, pair));
  const module = join("inspectors", `${OWL_CHAIN}.json`);
  if (top.inspector !== OWL_CHAIN) refuse(at, "inspector", `it names ${JSON.stringify(top.inspector)}, and the one inspector module this version loads is ${OWL_CHAIN}, in ${module}`);
  if (!isFile(join(bundleDir, module))) refuse(at, "inspector", `it names "${OWL_CHAIN}", and the bundle holds no module ${module}`);
  const { checks, stage, record } = moduleOf(bundleDir);
  const byPair = Object.fromEntries([...read, stage].map((each) => [pairKey(each.pair), each])) as Record<PairKey, Stage>;
  return { workflow: OWL_CHAIN, skeleton: SKELETON, inspector: OWL_CHAIN, stages: byPair, checks, record };
}

/** The stage of a workflow that runs as a pair of the protocol. */
export function stageFor(workflow: Workflow, pair: RoleStage): Stage {
  return workflow.stages[pairKey(pair)];
}

/**
 * A definition's text with its stage's model as the last line of its
 * frontmatter. It throws, naming the definition by `agent`, where the text
 * opens with no frontmatter, and where the frontmatter names a model of its
 * own, since a stage's model stands in its workflow's file or its module's
 * alone.
 */
export function withModel(text: string, model: string, agent: string): string {
  const head = FRONTMATTER.exec(text);
  if (head === null) throw new Error(`The agent definition ${agent} opens with no frontmatter, so the build has nowhere to write its stage's model.`);
  if (/^model:/mu.test(head[1] ?? "")) throw new Error(`The agent definition ${agent} names a model of its own, and a stage's model stands in its workflow's file or its inspector module's alone.`);
  return `---\n${head[1] ?? ""}\nmodel: ${model}\n---\n${text.slice(head[0].length)}`;
}

/**
 * The build's step for a pane's subagent: in the bundle at `bundleDir`, the
 * built copy, it writes into the definition of each stage that names a model
 * that model (`withModel`), so a pane's session that starts the stage's
 * subagent with no model still runs it on the stage's. A role session of the
 * daemon is given the model on its command line as well. It loads the
 * workflow from that bundle first, so a file the loader refuses stops the
 * build, and gives the definitions it wrote, by their paths in the bundle.
 */
export function writeDefinitionModels(bundleDir: string): string[] {
  const workflow = loadWorkflow(bundleDir);
  const written: string[] = [];
  for (const stage of Object.values(workflow.stages)) {
    if (stage.model === null) continue;
    const file = join(bundleDir, stage.agent);
    writeFileSync(file, withModel(readFileSync(file, "utf8"), stage.model, stage.agent));
    written.push(stage.agent);
  }
  return written;
}
