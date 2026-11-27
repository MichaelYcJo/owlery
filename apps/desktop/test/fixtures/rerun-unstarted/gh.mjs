// The answers of the stand-in `gh` beside this file. Each call's arguments go
// as one JSON line to the file GH_STAND_IN_CALLS names, so a case reads every
// call the command made, the writes among them. The answer to a call is the
// entry of the JSON file GH_STAND_IN_ANSWERS names whose key is the call's
// arguments joined by spaces: what gh prints on stdout and on stderr, and the
// code it exits with. A call with no entry exits 97 and says so, so a read or
// a write the case did not arrange fails the command.
import { appendFileSync, readFileSync } from "node:fs";

const args = process.argv.slice(2);
appendFileSync(process.env.GH_STAND_IN_CALLS, `${JSON.stringify(args)}\n`);
const answers = JSON.parse(readFileSync(process.env.GH_STAND_IN_ANSWERS, "utf8"));
const answer = answers[args.join(" ")];
if (answer === undefined) {
  process.stderr.write(`the stand-in for gh holds no answer for: gh ${args.join(" ")}\n`);
  process.exit(97);
}
process.stdout.write(answer.stdout ?? "");
process.stderr.write(answer.stderr ?? "");
process.exit(answer.status ?? 0);
