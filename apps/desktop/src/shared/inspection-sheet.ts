// The inspection sheet, composed once for the window and for the pull
// request's body: from what a work item's committed records say
// (`BackRecords`) and the ledger's entries of its stages, the inspection's record
// as rows, the sentences at its head, one part for each round with its
// findings and the stages that ran for it, the stages after the rounds, the
// sums, the sessions outside the chain, the refused calls and the lines not
// read. Where the ledger holds no stage of the chain, the sums are the
// sentence that says the stages ran outside the daemon. The window draws
// what this gives and the body writes it as Markdown, so both show one sum
// (docs/architecture.md, "State lives in three places").
//
// A stage's cost is set beside its round by the entry's `chain`, the kind
// and the round of the chain's stage it is for, and never by the order or
// the time of the entries. A converted cost is never added to a charged one.
//
// It reads no file and no clock, and imports nothing of the daemon or the
// renderer. A text holds a commit, a path or a name between backticks,
// which the body writes as Markdown and the window draws as code.
import { type BackFinding, type BackRound, type ChainStageKind, type LedgerEntry, type BackRecords, type Usage } from "./protocol";

/** The words over the cells of a stage's line, in the window's back and in the table of the pull request's body alike. */
export const STAGE_COLUMNS = ["Stage", "Ended", "Time", "Tokens in / out", "Cache read / written", "Cost"] as const;

/** A stage's cost: its amount with whether it is converted, `none` where the stage reported no cost, or null for a stage that is no agent's turn. */
export type StageCost = { amount: string; converted: boolean } | "none" | null;

/** One stage's line: its name, how it ended where it did not finish by itself, whether it failed, the time from its start to its end, the tokens its models used, summed, and its cost. */
export interface StageLine {
  name: string;
  ended: string | null;
  failed: boolean;
  time: string;
  /** Null where the stage reported no usage or no model. A count no model reported reads `none`. */
  tokens: { input: string; output: string; cacheRead: string; cacheWritten: string } | null;
  cost: StageCost;
}

/** One finding's line: its number, its symptom, its severity, each place as `path:line`, its close, whether it is open, and the earlier finding or round it names. */
export interface FindingLine {
  number: number;
  says: string;
  severity: string;
  places: string[];
  close: string;
  open: boolean;
  names: string | null;
}

/** One round's part: its number, its title with the commit it read, its findings, the sentence of a round with none, the lines of its record not read, and the stages that ran for it. */
export interface RoundPart {
  round: number;
  title: string;
  findings: FindingLine[];
  says: string | null;
  unread: string | null;
  stages: StageLine[];
}

/** The inspection sheet, as plain values. */
export interface Back {
  /** The inspection's record as rows, and none where the records hold no inspection. */
  record: { label: string; value: string }[];
  /** The line of a lapsed inspection that names the commit that lapsed it, and the commit's subject. */
  lapsedBy: { says: string; subject: string } | null;
  head: string[];
  rounds: RoundPart[];
  /** The broad gate's and the inspector's lines, and a ruling on the inspector's question after the inspector's line, in the ledger's order. */
  after: StageLine[];
  /** The sentences on what the chain's stages cost, or the one that says the stages ran outside the daemon, where the records hold a round or a verdict and the ledger holds no stage of the chain. */
  sums: string[];
  outside: string | null;
  /** The sentence that says what a converted cost is, where a converted cost is shown. */
  converted: string | null;
  refused: string[];
  unread: string[];
}

/** The kinds of stage that ran for a round: a ruling that follows the inspector's entry of its round is the inspector's question's, and runs after the rounds. */
const ROUND_KINDS: readonly ChainStageKind[] = ["round", "fix-pass", "judgment", "ruling"];

/** The kinds of stage that are no agent's turn, so that no cost is asked of them. */
const NO_TURN: readonly ChainStageKind[] = ["gate", "pull-request"];

/** Each kind's name in a stage's line, typed over every kind, so a kind with no name does not compile. */
const STAGE_NAMES: Record<ChainStageKind, (round: number) => string> = {
  round: (round) => `Round ${String(round)}`,
  "fix-pass": (round) => `Fix pass on round ${String(round)}`,
  judgment: (round) => `Judgment after round ${String(round)}`,
  ruling: (round) => `Ruling after round ${String(round)}`,
  gate: () => "Broad gate",
  inspection: () => "Inspector",
  "pull-request": () => "Pull request",
};

/** How a stage that stopped before it ended by itself ended. */
const STOPPED_WORDS: Record<NonNullable<LedgerEntry["stopped"]>, string> = { limit: "Stopped at its limit", request: "Stopped", daemon: "Stopped with the daemon" };

const CONVERTED_SAYS = "A converted cost is the usage priced at API prices, and it is not a charge.";

/** What the back says of the costs where the records hold a round or a verdict and the ledger holds no stage of the work item's chain: the daemon ran none of the stages, so it holds no cost of them. */
const OUTSIDE_DAEMON_SAYS = "The stages of this chain ran outside Owlery's daemon, in a pane's session or in another tool, and Owlery read no cost of them.";

/** A count of a noun, the noun in the plural where the count is not 1. */
function counted(count: number, noun: string, plural = `${noun}s`): string {
  return `${String(count)} ${count === 1 ? noun : plural}`;
}

/** A list joined as a sentence joins it: `a`, `a and b`, `a, b and c`. */
function joined(parts: readonly string[]): string {
  return parts.length <= 1 ? (parts[0] ?? "") : `${parts.slice(0, -1).join(", ")} and ${parts.at(-1) ?? ""}`;
}

/** A commit as the back shows it: its first seven characters. */
function shown(commit: string): string {
  return commit.slice(0, 7);
}

/** A cost in US dollars with two decimals, or `under $0.01` where it is above zero and below a cent. */
export function costWords(usd: number): string {
  return usd > 0 && usd < 0.01 ? "under $0.01" : `$${usd.toFixed(2)}`;
}

/** A count of tokens, whole, with a comma at each thousand. */
export function tokenWords(count: number): string {
  return String(Math.trunc(count)).replace(/\B(?=(\d{3})+(?!\d))/gu, ",");
}

/** A span of time: `under 1 min`, `4 min`, `1 h` or `1 h 12 min`, in whole minutes. */
export function spanWords(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "under 1 min";
  if (minutes < 60) return `${String(minutes)} min`;
  const rest = minutes % 60;
  return `${String(Math.floor(minutes / 60))} h${rest === 0 ? "" : ` ${String(rest)} min`}`;
}

/** A stage's cost as the body writes it: the amount with `converted` after a converted one, `No cost reported`, or nothing for a stage that is no agent's turn. */
export function costText(cost: StageCost): string {
  if (cost === null) return "";
  if (cost === "none") return "No cost reported";
  return cost.converted ? `${cost.amount} converted` : cost.amount;
}

/** The sum of the models' counts of one kind, worded, or `none` where no model reported it. */
function tokensOf(usage: Usage, count: (model: Usage["models"][number]) => number | null): string {
  const reported = usage.models.map(count).filter((value) => value !== null);
  return reported.length === 0 ? "none" : tokenWords(reported.reduce((sum, value) => sum + value, 0));
}

function stageLine(entry: LedgerEntry, kind: ChainStageKind, round: number): StageLine {
  const { usage } = entry;
  const noTurn = NO_TURN.includes(kind);
  return {
    name: STAGE_NAMES[kind](round),
    ended: entry.stopped !== null ? STOPPED_WORDS[entry.stopped] : entry.state === "failed" ? "Failed" : null,
    failed: entry.state === "failed",
    time: spanWords(entry.endedAt - entry.startedAt),
    tokens:
      usage === null || usage.models.length === 0
        ? null
        : {
            input: tokensOf(usage, (model) => model.inputTokens),
            output: tokensOf(usage, (model) => model.outputTokens),
            cacheRead: tokensOf(usage, (model) => model.cacheReadTokens),
            cacheWritten: tokensOf(usage, (model) => model.cacheWriteTokens),
          },
    cost: noTurn ? null : usage === null || usage.costUsd === null ? "none" : { amount: costWords(usage.costUsd), converted: usage.converted },
  };
}

/** What the entries cost, the converted and the charged apart, each with its word, or null where none reported a cost. */
function costsOf(entries: readonly LedgerEntry[]): string | null {
  const reported = entries.flatMap(({ usage }) => (usage === null || usage.costUsd === null ? [] : [usage]));
  const converted = reported.filter((usage) => usage.converted);
  const charged = reported.filter((usage) => !usage.converted);
  const sum = (usages: readonly Usage[]): number => usages.reduce((total, usage) => total + (usage.costUsd ?? 0), 0);
  const parts = [...(converted.length > 0 ? [`${costWords(sum(converted))} converted`] : []), ...(charged.length > 0 ? [`${costWords(sum(charged))} charged`] : [])];
  return parts.length === 0 ? null : joined(parts);
}

/** A finding's close in words. */
function closeWords(close: BackFinding["close"]): string {
  if (close === null) return "Open";
  if (close.verdict === "fixed") return close.commit === null ? "Fixed" : `Fixed in \`${shown(close.commit)}\``;
  if (close.verdict === "rejected") return "Rejected";
  return close.home === null ? "Deferred" : `Deferred to \`${close.home}\``;
}

/** The earlier finding or round a finding names, as a sentence, or null. */
function namesWords(finding: BackFinding): string | null {
  if (finding.reopens !== null) return `It reopens round ${String(finding.reopens.round)}'s finding ${String(finding.reopens.finding)}.`;
  const { regression } = finding;
  if (regression === null) return null;
  return regression.finding === null ? `It is a regression of round ${String(regression.round)}.` : `It is a regression of round ${String(regression.round)}'s finding ${String(regression.finding)}.`;
}

function findingLine(finding: BackFinding): FindingLine {
  return {
    number: finding.number,
    says: finding.says,
    severity: finding.severity,
    places: finding.places.map(({ path, lines }) => (lines === null ? path : `${path}:${lines}`)),
    close: closeWords(finding.close),
    open: finding.close === null,
    names: namesWords(finding),
  };
}

/** The sentence of a round with no finding, which names the earlier findings it confirmed where it confirmed any. */
function noFindingSays(round: BackRound): string {
  if (round.confirms.length === 0) return "No finding.";
  return `No finding. It confirmed ${joined(round.confirms.map(({ round: earlier, finding }) => `round ${String(earlier)}'s finding ${String(finding)}`))}.`;
}

/** The sentences at the back's head: the defects caught and fixed, the findings rejected, deferred and open, and the count of findings of each round. */
function headOf(rounds: readonly BackRound[], cleared: boolean): string[] {
  if (rounds.length === 0) return ["No review round is recorded."];
  const findings = rounds.flatMap((round) => round.findings.map((finding) => ({ round: round.round, finding })));
  if (findings.length === 0) return ["The review rounds caught nothing."];
  const reopened = new Set(findings.flatMap(({ finding }) => (finding.reopens === null ? [] : [`${String(finding.reopens.round)}#${String(finding.reopens.finding)}`])));
  const defects = findings.filter(({ round, finding }) => finding.close?.verdict === "fixed" && !reopened.has(`${String(round)}#${String(finding.number)}`)).length;
  const fixed = defects === 0 ? "no defect that was fixed" : `${counted(defects, "defect")} that ${defects === 1 ? "was" : "were"} fixed`;
  const head = [`The review rounds caught ${fixed}${cleared ? " before the inspection" : ""}.`];
  const rejected = findings.filter(({ finding }) => finding.close?.verdict === "rejected").length;
  const deferred = findings.filter(({ finding }) => finding.close?.verdict === "deferred").length;
  const open = findings.filter(({ finding }) => finding.close === null).length;
  const parts = [...(rejected > 0 ? [[rejected, `${rejected === 1 ? "was" : "were"} rejected`] as const] : []), ...(deferred > 0 ? [[deferred, `${deferred === 1 ? "was" : "were"} deferred`] as const] : []), ...(open > 0 ? [[open, `${open === 1 ? "is" : "are"} open`] as const] : [])];
  if (parts.length > 0) head.push(`${joined(parts.map(([count, said], at) => `${at === 0 ? counted(count, "finding") : String(count)} ${said}`))}.`);
  head.push(`Findings by round: ${rounds.map((round) => String(round.findings.length)).join(", ")}.`);
  return head;
}

/** One line for each stage that was refused a call, in the order of the stages' first rows, with the count for each rule. */
function refusedOf(refusals: BackRecords["refusals"]): string[] {
  const stages = new Map<string, Map<string, number>>();
  for (const { kind, round, rule } of refusals) {
    const name = STAGE_NAMES[kind](round);
    const rules = stages.get(name) ?? new Map<string, number>();
    rules.set(rule, (rules.get(rule) ?? 0) + 1);
    stages.set(name, rules);
  }
  return [...stages].map(([name, rules]) => {
    const total = [...rules.values()].reduce((sum, count) => sum + count, 0);
    return `${name} was refused ${counted(total, "call")}: ${joined([...rules].map(([rule, count]) => `${String(count)} by \`${rule}\``))}.`;
  });
}

/**
 * The inspection sheet from what the records say, the ledger's entries of the
 * work item in the order their stages ended, and the count of the ledger's
 * lines that were not read. An entry whose `chain` is null is a session
 * outside the chain, whatever its pair, and enters no round and no sum of
 * the chain.
 */
export function composeBack(records: BackRecords, entries: readonly LedgerEntry[], unreadLedger: number): Back {
  const chained = entries.filter((entry): entry is LedgerEntry & { chain: NonNullable<LedgerEntry["chain"]> } => entry.chain !== null);
  const byRound = new Map<number, StageLine[]>();
  const after: StageLine[] = [];
  const cleared = new Set<number>();
  for (const entry of chained) {
    const { kind, round } = entry.chain;
    const line = stageLine(entry, kind, round);
    if (ROUND_KINDS.includes(kind) && !(kind === "ruling" && cleared.has(round))) byRound.set(round, [...(byRound.get(round) ?? []), line]);
    else after.push(line);
    if (kind === "inspection") cleared.add(round);
  }
  const recorded = new Map(records.rounds.map((round) => [round.round, round]));
  const numbers = [...new Set([...recorded.keys(), ...byRound.keys()])].sort((a, b) => a - b);
  const rounds = numbers.map((number): RoundPart => {
    const round = recorded.get(number);
    const stages = byRound.get(number) ?? [];
    if (round === undefined) return { round: number, title: `Round ${String(number)}`, findings: [], says: `No record of round ${String(number)} is committed.`, unread: null, stages };
    return {
      round: number,
      title: round.target === null ? `Round ${String(number)}` : `Round ${String(number)}, on \`${shown(round.target)}\``,
      findings: round.findings.map(findingLine),
      says: round.findings.length === 0 ? noFindingSays(round) : null,
      unread: round.unread === 0 ? null : `${counted(round.unread, "line")} of round ${String(number)}'s record ${round.unread === 1 ? "was" : "were"} not read.`,
      stages,
    };
  });

  const { record } = records;
  const rows =
    record === null
      ? []
      : [
          { label: "Tree", value: record.branch === null ? `\`${shown(record.commit)}\`` : `\`${shown(record.commit)}\` on \`${record.branch}\`` },
          { label: "Base", value: `\`${record.base}\`` },
          { label: "Item", value: `\`${record.item}\`` },
          ...(record.gate === null ? [] : [{ label: "Gate", value: `\`${shown(record.gate)}\`` }]),
          { label: "Rounds", value: String(record.rounds) },
          ...(record.builtBy.length === 0 ? [] : [{ label: "Built by", value: record.builtBy.join(", ") }]),
          ...(record.inspectedBy === null ? [] : [{ label: "Inspected by", value: record.inspectedBy }]),
          ...(record.model === null ? [] : [{ label: "Model", value: record.model }]),
          ...(record.rules === null ? [] : [{ label: "Rules", value: record.rules }]),
        ];

  const sums: string[] = chained.length === 0 && (records.rounds.length > 0 || record !== null) ? [OUTSIDE_DAEMON_SAYS] : [];
  const chainCost = costsOf(chained);
  if (chainCost !== null) sums.push(`The chain's stages cost ${chainCost}.`);
  const unreported = chained.filter(({ chain, usage }) => !NO_TURN.includes(chain.kind) && (usage === null || usage.costUsd === null)).length;
  if (unreported > 0) sums.push(`${counted(unreported, "stage")} reported no cost.`);

  const outsiders = entries.filter((entry) => entry.chain === null);
  const outsideCost = costsOf(outsiders);
  const asked = `${counted(outsiders.length, "session")} asked outside the chain`;
  const outside = outsiders.length === 0 ? null : outsideCost === null ? `${asked} reported no cost.` : `${asked} cost ${outsideCost}.`;

  const converted = entries.some(({ usage }) => usage !== null && usage.converted && usage.costUsd !== null) ? CONVERTED_SAYS : null;
  const unread = [
    ...(records.unreadRefusals === 0 ? [] : [`${counted(records.unreadRefusals, "row")} of the refused calls ${records.unreadRefusals === 1 ? "was" : "were"} not read.`]),
    ...(unreadLedger === 0 ? [] : [`${counted(unreadLedger, "line")} of the ledger ${unreadLedger === 1 ? "was" : "were"} not read.`]),
  ];
  return {
    record: rows,
    lapsedBy: records.lapsedBy === null ? null : { says: `Lapsed by \`${shown(records.lapsedBy.commit)}\``, subject: records.lapsedBy.subject },
    head: headOf(records.rounds, record !== null),
    rounds,
    after,
    sums,
    outside,
    converted,
    refused: refusedOf(records.refusals),
    unread,
  };
}
