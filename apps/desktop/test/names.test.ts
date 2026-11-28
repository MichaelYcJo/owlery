// layer: logic
import { describe, expect, it } from "vitest";
import { slugFor } from "../src/daemon/worktrees";
import { FIRST_WORDS, generateName, SECOND_WORDS } from "../src/shared/names";

/** A source of randomness that gives the values in turn. */
function draws(...values: number[]): () => number {
  let next = 0;
  return () => values[next++ % values.length]!;
}

describe("generateName", () => {
  it("gives two of its words joined by one dash, a name slugFor returns unchanged, for every pair of the two lists", () => {
    const names = new Set<string>();
    for (const [i, first] of FIRST_WORDS.entries()) {
      for (const [j, second] of SECOND_WORDS.entries()) {
        // A draw in the middle of each word's share of the range.
        const name = generateName(draws((i + 0.5) / FIRST_WORDS.length, (j + 0.5) / SECOND_WORDS.length));
        expect(name).toBe(`${first}-${second}`);
        expect(name).toMatch(/^[a-z]+-[a-z]+$/);
        expect(slugFor(name)).toBe(name);
        names.add(name);
      }
    }
    // Two different draws give two names: no word stands twice in its list.
    expect(names.size).toBe(FIRST_WORDS.length * SECOND_WORDS.length);
    expect(names.size).toBeGreaterThan(1);
  });

  it("gives a word of its lists at both ends of the range a source of randomness draws from", () => {
    expect(generateName(() => 0)).toBe(`${FIRST_WORDS[0]}-${SECOND_WORDS[0]}`);
    // Math.random gives no 1, and a source that does still names a word.
    expect(generateName(() => 1)).toBe(`${FIRST_WORDS.at(-1)}-${SECOND_WORDS.at(-1)}`);
    expect(generateName(() => 0.999999)).toBe(`${FIRST_WORDS.at(-1)}-${SECOND_WORDS.at(-1)}`);
  });

  it("draws from Math.random where no source is given", () => {
    expect(generateName()).toMatch(/^[a-z]+-[a-z]+$/);
  });
});
