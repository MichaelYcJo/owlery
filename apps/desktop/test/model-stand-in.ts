// A stand-in for the model's API, on the loopback address, for a check that
// runs the real `claude` CLI: the CLI is pointed at it with
// `ANTHROPIC_BASE_URL` and a key that is no key, so the check spends no usage
// and needs no login. Its first answer to a session that holds `Bash` is one
// call of that tool with the command it was given, so the call the check is
// about is made by the stand-in and not by a model's turn. Every other
// streamed request to the messages endpoint is answered with one line of
// text. It answers only what a run showed the CLI asks, streamed messages
// requests: any other request, a messages request that is not streamed among
// it, is refused with 404 and its method and path, and the check prints every
// request the stand-in kept.
import { createServer, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";

/** What the stand-in kept of one request: its method, its path with its query, and its body as JSON, or null where the body was none. */
export interface Received {
  method: string;
  path: string;
  body: Record<string, unknown> | null;
}

/** A block of content the stand-in answers with: the one call, or a line of text. */
type Block = { type: "tool_use"; id: string; name: string; input: { command: string; description: string } } | { type: "text"; text: string };

/** The line of text every answer but the call holds. */
export const STAND_IN_TEXT = "The stand-in model makes no other call.";

/** The tool results a request's messages hold, each as the CLI sent it. */
export function toolResults(body: Record<string, unknown> | null): Record<string, unknown>[] {
  const messages = Array.isArray(body?.messages) ? (body.messages as { content?: unknown }[]) : [];
  return messages.flatMap((message) => (Array.isArray(message.content) ? (message.content as Record<string, unknown>[]).filter((block) => block.type === "tool_result") : []));
}

/** An assistant message of the API, holding the blocks given and the reason it stopped. */
function message(model: unknown, content: Block[], stop: "tool_use" | "end_turn" | null): Record<string, unknown> {
  return { id: "msg_stand_in", type: "message", role: "assistant", model, content, stop_reason: stop, stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 } };
}

/** The answer as the server-sent events of a streamed message, in the order the API sends them. */
function streamed(response: ServerResponse, model: unknown, block: Block, stop: "tool_use" | "end_turn"): void {
  const events = [
    { type: "message_start", message: message(model, [], null) },
    { type: "content_block_start", index: 0, content_block: block.type === "tool_use" ? { ...block, input: {} } : { type: "text", text: "" } },
    { type: "content_block_delta", index: 0, delta: block.type === "tool_use" ? { type: "input_json_delta", partial_json: JSON.stringify(block.input) } : { type: "text_delta", text: block.text } },
    { type: "content_block_stop", index: 0 },
    { type: "message_delta", delta: { stop_reason: stop, stop_sequence: null }, usage: { output_tokens: 1 } },
    { type: "message_stop" },
  ];
  response.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache" });
  for (const event of events) response.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
  response.end();
}

/**
 * Starts the stand-in at a port the system gives, and gives its address, the
 * requests it received in the order they came, and a function that closes
 * it. `command` gives the command of the `Bash` call it answers a session's
 * first request with: a request whose tools name `Bash` and whose messages
 * hold no tool result. It is called when that request arrives, so a command
 * can name a folder the session was given only when it started.
 */
export async function startModelStandIn(command: () => string): Promise<{ url: string; received: Received[]; close: () => Promise<void> }> {
  const received: Received[] = [];
  const server = createServer((request, response) => {
    let text = "";
    request.setEncoding("utf8");
    request.on("data", (chunk: string) => {
      text += chunk;
    });
    request.on("end", () => {
      let body: Record<string, unknown> | null = null;
      try {
        const parsed: unknown = JSON.parse(text);
        if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) body = parsed as Record<string, unknown>;
      } catch {
        // A body that is no JSON is kept as none.
      }
      const path = request.url ?? "";
      received.push({ method: request.method ?? "", path, body });
      const pathname = new URL(path, "http://stand-in").pathname;
      if (request.method === "POST" && pathname === "/v1/messages" && body?.stream === true) {
        const tools = Array.isArray(body.tools) ? (body.tools as { name?: unknown }[]).map((tool) => tool.name) : [];
        const block: Block = tools.includes("Bash") && toolResults(body).length === 0 ? { type: "tool_use", id: "toolu_stand_in_1", name: "Bash", input: { command: command(), description: "The stand-in model's one call" } } : { type: "text", text: STAND_IN_TEXT };
        streamed(response, body.model, block, block.type === "tool_use" ? "tool_use" : "end_turn");
        return;
      }
      // No run showed the CLI ask anything else, a messages request that is not streamed among it, so it is refused by name and printed.
      response.writeHead(404, { "content-type": "application/json" });
      response.end(JSON.stringify({ type: "error", error: { type: "not_found_error", message: `The stand-in model answers no ${request.method ?? ""} ${pathname}${pathname === "/v1/messages" ? " that is not streamed" : ""}.` } }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    url: `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`,
    received,
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
        server.closeAllConnections();
      }),
  };
}
