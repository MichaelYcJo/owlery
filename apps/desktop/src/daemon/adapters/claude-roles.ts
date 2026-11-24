// What a role is to the Claude adapter: an agent of the role bundle, the
// plugin folder the app ships (role-bundle/, built to dist/bundle/), and one
// file of rules the adapter appends to the session's system prompt
// (docs/architecture.md, "What each session loads"). The chain command hands
// a pane's session the same file with another head, for the subagent the
// session runs the role as. The protocol's pairs of a role and a stage are
// neutral, and this module is where a pair turns into Claude Code's names.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { RoleStage } from "../../shared/protocol";
import { grantOf, type PairKey, pairKey } from "../role-grants";

/** The name of the bundle's plugin, as its manifest states it. Claude Code names a plugin's agent `<plugin>:<agent>`. */
export const PLUGIN_NAME = "owlery";

/** The bundle's documents every role is bound by, which open every rules file. */
const EVERY_ROLE = ["skills/core/SKILL.md", "skills/agent-contract/SKILL.md"];

/**
 * For each pair, the bundle's documents that follow the two of every role:
 * the ones the role's definition opens and follows first at that stage. The
 * bundle's other documents are read where a step asks for one, in the
 * bundle's folder, so a launch does not carry them.
 */
const AT_THE_STAGE: Record<PairKey, readonly string[]> = {
  "proofer at round": ["skills/code-review/SKILL.md"],
  "crafter at fix-pass": ["skills/implement/SKILL.md", "skills/implement/fix-pass.md"],
  "sealer at seal": [],
  "orchestrator at judgment": ["docs/forms/the-round-record.md"],
};

/** The bundle's documents a role session's rules file holds, by their paths in the bundle, in the order they follow the head. */
export function roleDocuments(role: RoleStage): string[] {
  return [...EVERY_ROLE, ...AT_THE_STAGE[pairKey(role)]];
}

/**
 * The built-in tools of Claude Code a role session holds, by the names its
 * `--tools` option takes, in the order a launch passes them: the four that
 * read a file, search and run a command, and the two that write a file where
 * the role's grant names a place to write. No other built-in tool reaches a
 * role session.
 */
export function toolsOf(role: RoleStage): string[] {
  return ["Read", "Glob", "Grep", "Bash", ...(grantOf(role).writes === "nowhere" ? [] : ["Edit", "Write"])];
}

/** The name Claude Code gives the role's agent of the bundle. */
export function agentOf(role: RoleStage): string {
  return `${PLUGIN_NAME}:${role.role}`;
}

/** The name of a pair's rules file in the folder the adapter writes them to. */
export function rulesFileName(role: RoleStage): string {
  return `${role.role}-${role.stage}.md`;
}

/** How a role is launched: as a role session of the daemon, or as a subagent of a pane's session, which the chain command hands its rules. */
export type Launch = "session" | "pane";

/**
 * The head of a rules file: who the session is, where the bundle stands, the
 * documents that follow, the tools the session holds with what to do where a
 * call is refused, and what to do at a step that names something the bundle
 * does not hold. The taken documents still name AgenticSeal's commands and
 * scripts, which the bundle does not ship, and tools the session does not
 * hold. Two sentences say what holds in the launch. A role session of the
 * daemon has the documents in its system prompt, holds the tools its launch
 * names and is answered by the daemon. A subagent of a pane's session reads
 * the file, holds the tools its definition names and is answered by the
 * person's own permission settings.
 */
export function rulesHead(bundleDir: string, role: RoleStage, launch: Launch = "session"): string {
  return [
    `# Owlery role session: ${role.role}, ${role.stage}`,
    "",
    `You are the ${role.role} of the Owlery role bundle, at the stage \`${role.stage}\`. Your definition is \`agents/${role.role}.md\` of the bundle.`,
    "",
    `The bundle's root is \`${bundleDir}\`. Every \`agents/\`, \`skills/\`, \`docs/\` and \`templates/\` path that your definition and the rules below cite is a path under that root, and you read it there.`,
    "",
    launch === "pane" ? "The documents below follow this head whole, in this order, so do not open them again in the bundle:" : "The documents below follow this head whole, in this order. Each is in your context already, so do not open it again:",
    "",
    ...roleDocuments(role).map((document) => `- \`${document}\``),
    "",
    launch === "pane"
      ? "You hold the tools your definition names, and the tools of the session that started you where it names none. The person's own permission settings answer every call that asks for permission. Where a call is refused, do not work around it: say in your report which step needed the call."
      : `You hold these tools and no other: ${toolsOf(role).join(", ")}. The daemon answers every call that asks for permission by the rule of your role, and no person is asked. Where it refuses a call, do not work around it: say in your report which step needed the call.`,
    "",
    "Those four directories hold documents only. A path under them that the bundle does not hold is not shipped, and neither is any `seal <subcommand>` command line or any script. Where a step needs one of them, do not look for it elsewhere and do not put another in its place: say in your report which step needed it.",
    "",
  ].join("\n");
}

/** A document without its frontmatter, the lines between a first line `---` and the next, which is for the harness that lists a skill or an agent and no rule. */
function withoutFrontmatter(text: string): string {
  return text.replace(/^---\n[\s\S]*?\n---\n+/, "");
}

/**
 * The text of a pair's rules file: the head of the launch, then each of the
 * pair's documents whole, without its frontmatter, after a line that names
 * it. It throws, naming the document, where the bundle lacks one.
 */
export function rulesText(bundleDir: string, role: RoleStage, launch: Launch = "session"): string {
  const documents = roleDocuments(role).map((document) => {
    let text: string;
    try {
      text = readFileSync(join(bundleDir, document), "utf8");
    } catch {
      throw new Error(`the role bundle lacks ${document} (${bundleDir})`);
    }
    return `===== ${document} =====\n\n${withoutFrontmatter(text)}`;
  });
  return [rulesHead(bundleDir, role, launch), ...documents].join("\n");
}
