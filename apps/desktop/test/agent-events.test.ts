// layer: logic
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { agentSaid, isInterruptionEntry } from "../src/daemon/agent-events";

describe("agentSaid", () => {
  it("reads the tool's name of a Claude Code permission request, and no text", () => {
    expect(agentSaid("PermissionRequest", { tool_name: "Bash", tool_input: { command: "ls" }, message: "not read here", last_assistant_message: "nor this" })).toEqual({ text: null, tool: "Bash", questions: null });
  });

  it("reads the last message of a Claude Code turn's end, and no tool", () => {
    expect(agentSaid("Stop", { last_assistant_message: "The form is in src/form.ts.", tool_name: "Bash", message: "not read here" })).toEqual({ text: "The form is in src/form.ts.", tool: null, questions: null });
  });

  it("reads the error text of a Claude Code turn that ended on an API error, from the event as the hooks reference gives it, and no tool", () => {
    const { payload } = JSON.parse(readFileSync(join(__dirname, "fixtures", "claude-stop-failure.json"), "utf8")) as { payload: Record<string, unknown> };
    expect(agentSaid("StopFailure", payload)).toEqual({ text: "API Error: Rate limit reached", tool: null, questions: null });
    expect(agentSaid("StopFailure", { error: "rate_limit", error_details: "429 Too Many Requests" })).toEqual({ text: null, tool: null, questions: null });
  });

  it("reads the message of a Claude Code notification where it is text, and no tool", () => {
    expect(agentSaid("Notification", { message: "Claude needs your permission to use Bash", tool_name: "Bash", last_assistant_message: "not read here" })).toEqual({ text: "Claude needs your permission to use Bash", tool: null, questions: null });
    expect(agentSaid("Notification", { message: { text: "an object" } })).toEqual({ text: null, tool: null, questions: null });
    expect(agentSaid("Notification", {})).toEqual({ text: null, tool: null, questions: null });
  });

  it("reads neither where the event carries none, or carries one that is not text or holds no letter", () => {
    expect(agentSaid("PermissionRequest", {})).toEqual({ text: null, tool: null, questions: null });
    expect(agentSaid("PermissionRequest", { tool_name: 7 })).toEqual({ text: null, tool: null, questions: null });
    expect(agentSaid("PermissionRequest", { tool_name: " " })).toEqual({ text: null, tool: null, questions: null });
    expect(agentSaid("Stop", {})).toEqual({ text: null, tool: null, questions: null });
    expect(agentSaid("Stop", { last_assistant_message: 7 })).toEqual({ text: null, tool: null, questions: null });
    expect(agentSaid("Stop", { last_assistant_message: " \n" })).toEqual({ text: null, tool: null, questions: null });
  });

  it("reads neither from any other event, though it carries a tool's name or a message", () => {
    for (const hook of ["SessionStart", "UserPromptSubmit", "PreToolUse", "PostToolUse", "PostToolUseFailure", "SubagentStop", "toString"]) {
      expect(agentSaid(hook, { tool_name: "Bash", message: "m", last_assistant_message: "l" })).toEqual({ text: null, tool: null, questions: null });
    }
  });

  /** A call of Claude Code's question tool as its hooks carry it: two questions, the first with two options, the second taking more than one. */
  const ASKING = {
    tool_name: "AskUserQuestion",
    tool_input: {
      questions: [
        {
          question: "Which library formats the dates?",
          header: "Dates",
          multiSelect: false,
          options: [
            { label: "date-fns", description: "Small functions, one import each." },
            { label: "dayjs", description: "One object, with plugins.", preview: "not read" },
          ],
        },
        { question: "Which checks run before a commit?", header: "Checks", multiSelect: true, options: [{ label: "Lint", description: "" }, { label: "Types", description: "tsc --noEmit" }] },
      ],
    },
  };
  const ASKED = [
    {
      asks: "Which library formats the dates?",
      options: [
        { label: "date-fns", implies: "Small functions, one import each." },
        { label: "dayjs", implies: "One object, with plugins." },
      ],
      multiple: false,
    },
    { asks: "Which checks run before a commit?", options: [{ label: "Lint", implies: "" }, { label: "Types", implies: "tsc --noEmit" }], multiple: true },
  ];

  it("reads the questions a call of Claude Code's question tool asks, from its start and from its permission request, with the first question as the text", () => {
    expect(agentSaid("PreToolUse", ASKING)).toEqual({ text: "Which library formats the dates?", tool: null, questions: ASKED });
    expect(agentSaid("PermissionRequest", ASKING)).toEqual({ text: "Which library formats the dates?", tool: "AskUserQuestion", questions: ASKED });
  });

  it("reads no question from a call of another tool, from an input that holds none, or from another event of the question tool", () => {
    const none = { text: null, tool: null, questions: null };
    expect(agentSaid("PreToolUse", { ...ASKING, tool_name: "Bash" })).toEqual(none);
    expect(agentSaid("PermissionRequest", { ...ASKING, tool_name: "Bash" })).toEqual({ ...none, tool: "Bash" });
    expect(agentSaid("PreToolUse", { tool_input: ASKING.tool_input })).toEqual(none);
    for (const tool_input of [undefined, null, "questions", [ASKING.tool_input], {}, { questions: "Which?" }, { questions: {} }, { questions: [] }, { questions: [null, 7, "Which?", { question: 7 }, { question: " \n", options: [{ label: "a", description: "b" }] }, { options: [] }] }]) {
      expect(agentSaid("PreToolUse", { tool_name: "AskUserQuestion", tool_input }), JSON.stringify(tool_input)).toEqual(none);
      expect(agentSaid("PermissionRequest", { tool_name: "AskUserQuestion", tool_input }), JSON.stringify(tool_input)).toEqual({ ...none, tool: "AskUserQuestion" });
    }
    for (const hook of ["PostToolUse", "PostToolUseFailure", "Notification", "Stop", "UserPromptSubmit"]) {
      expect(agentSaid(hook, ASKING).questions, hook).toBeNull();
    }
  });

  it("leaves out a question with no text and an option with no label, reads a description that is no text as empty and more than one choice only where it is said to be, and keeps 8 questions of 8 options at most", () => {
    const questions = [
      { header: "No text" },
      { question: "Which base?", options: [{ description: "no label" }, { label: " ", description: "an empty label" }, { label: 7 }, null, "main", { label: "main", description: 7 }, { label: "dev" }], multiSelect: "true" },
      { question: "Which order?", options: "none", multiSelect: 1 },
      { question: "Which name?" },
    ];
    expect(agentSaid("PreToolUse", { tool_name: "AskUserQuestion", tool_input: { questions } }).questions).toEqual([
      { asks: "Which base?", options: [{ label: "main", implies: "" }, { label: "dev", implies: "" }], multiple: false },
      { asks: "Which order?", options: [], multiple: false },
      { asks: "Which name?", options: [], multiple: false },
    ]);
    const nine = Array.from({ length: 9 }, (_, at) => ({ question: `Question ${at + 1}?`, options: Array.from({ length: 9 }, (_, of) => ({ label: `Choice ${of + 1}`, description: "" })) }));
    const kept = agentSaid("PreToolUse", { tool_name: "AskUserQuestion", tool_input: { questions: [{ header: "No text" }, ...nine] } }).questions ?? [];
    expect(kept.map(({ asks }) => asks)).toEqual(nine.slice(0, 8).map(({ question }) => question));
    expect(kept.map(({ options }) => options.map(({ label }) => label))).toEqual(Array.from({ length: 8 }, () => Array.from({ length: 8 }, (_, of) => `Choice ${of + 1}`)));
  });
});

describe("isInterruptionEntry", () => {
  /** Each line the session log gained in the recording of a Claude Code session in which the person interrupted a reply and then a Bash call. */
  const RECORDED = (JSON.parse(readFileSync(join(__dirname, "fixtures", "claude-interrupted-turn.json"), "utf8")) as { log: { line: string }[] }).log.map(({ line }) => line);
  /** The entry Claude Code wrote when the person interrupted the reply. */
  const REPLY = JSON.parse(RECORDED.find((line) => line.includes('"text":"[Request interrupted by user]"')) ?? "null") as Record<string, unknown>;
  const changed = (change: Record<string, unknown>): string => JSON.stringify({ ...REPLY, ...change });
  const saying = (content: unknown): Record<string, unknown> => ({ message: { role: "user", content } });

  it("reads the recording's two interruption entries as interruptions, the reply's and the tool call's, and no other line the recording's log gained", () => {
    expect(RECORDED.filter(isInterruptionEntry).map((line) => (JSON.parse(line) as { message: { content: { text: string }[] } }).message.content[0]?.text)).toEqual(["[Request interrupted by user]", "[Request interrupted by user for tool use]"]);
  });

  it("reads either marker as an interruption without the white space at its ends, beside other blocks, and where the entry says it is no subagent's and no message cut it", () => {
    expect(isInterruptionEntry(changed(saying([{ type: "text", text: " [Request interrupted by user for tool use]\n" }])))).toBe(true);
    expect(isInterruptionEntry(changed(saying([{ type: "image" }, { type: "text", text: "[Request interrupted by user]" }])))).toBe(true);
    expect(isInterruptionEntry(changed({ isSidechain: false, interruptedBySendNow: false }))).toBe(true);
  });

  it("reads no interruption in a subagent's entry, one a message the person sent wrote, an assistant's that quotes the marker, a person's whose text holds it among other words, a line that is no JSON, and an empty line", () => {
    for (const line of [
      changed({ isSidechain: true }),
      changed({ interruptedBySendNow: true }),
      changed({ type: "assistant", message: { role: "assistant", content: [{ type: "text", text: "[Request interrupted by user]" }] } }),
      changed(saying([{ type: "text", text: "Why did the log say [Request interrupted by user]?" }])),
      changed(saying("[Request interrupted by user]")),
      changed(saying([{ type: "tool_result", text: "[Request interrupted by user]" }])),
      "[Request interrupted by user]",
      '{"type":"user","message":',
      "",
    ]) {
      expect(isInterruptionEntry(line), line).toBe(false);
    }
  });
});
