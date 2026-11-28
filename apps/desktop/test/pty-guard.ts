// The guard of the `process` layer (scripts/layers.mjs): the `logic` and the
// `process` projects resolve `node-pty` to this module, so a case of either
// that starts a pty throws.
export function spawn(): never {
  throw new Error(`A case of a \`${process.env.OWLERY_TEST_LAYER}\` file started a pty. A file whose cases start a Daemon, a pane or a pty opens with \`// layer: pty\`.`);
}
