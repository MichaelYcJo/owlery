// The name Owlery gives a work item nobody named: two words drawn at random,
// as in `amber-heron`. The window shows one in the form, and the daemon makes
// one where a creation carries none. Every word is of the letters a-z alone,
// so the name is its own branch and folder name.

/** The first word of a generated name. No word stands twice. */
export const FIRST_WORDS: readonly string[] = [
  "amber", "ample", "azure", "balmy", "bold", "brave", "breezy", "bright",
  "brisk", "calm", "clear", "clever", "cosmic", "cozy", "crisp", "dapper",
  "deft", "eager", "early", "fair", "fleet", "fond", "fresh", "gentle",
  "glad", "golden", "grand", "hardy", "hazel", "humble", "ivory", "jolly",
  "keen", "kind", "lively", "lucid", "lunar", "mellow", "merry", "mild",
  "misty", "nimble", "noble", "olive", "opal", "patient", "plucky", "proud",
  "quick", "quiet", "rapid", "rosy", "royal", "rustic", "sandy", "silver",
  "snowy", "solar", "steady", "sunny", "swift", "tidy", "vivid", "witty",
];

/** The second word of a generated name. No word stands twice. */
export const SECOND_WORDS: readonly string[] = [
  "badger", "beacon", "birch", "bison", "brook", "canyon", "cedar", "comet",
  "coral", "crane", "creek", "delta", "dune", "eagle", "ember", "falcon",
  "fern", "finch", "fjord", "forest", "fox", "glacier", "grove", "harbor",
  "hare", "heron", "island", "juniper", "kestrel", "lagoon", "lark", "lynx",
  "maple", "marten", "meadow", "merlin", "moose", "orchid", "osprey", "otter",
  "owl", "panda", "pebble", "pine", "plover", "prairie", "quail", "raven",
  "reef", "river", "robin", "sparrow", "spruce", "summit", "swan", "thicket",
  "tiger", "tundra", "valley", "walnut", "willow", "wren", "yarrow", "zephyr",
];

/** The word of the list that a draw between 0 and 1 falls on. */
function drawn(words: readonly string[], draw: number): string {
  return words[Math.min(Math.floor(draw * words.length), words.length - 1)] ?? "";
}

/**
 * A name of two words joined by one dash, the first drawn from `FIRST_WORDS`
 * and the second from `SECOND_WORDS`. `random` gives each draw, a number from
 * 0 up to 1 as `Math.random` gives one.
 */
export function generateName(random: () => number = Math.random): string {
  return `${drawn(FIRST_WORDS, random())}-${drawn(SECOND_WORDS, random())}`;
}
