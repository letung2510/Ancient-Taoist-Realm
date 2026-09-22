"use strict";

const assert = require("assert");
const { generateCharacter } = require("../character_generator");

function makeRng() {
  const sequence = [0.11, 0.27, 0.43, 0.59, 0.73, 0.89, 0.17, 0.31, 0.47, 0.67, 0.83, 0.05];
  let index = 0;
  return () => sequence[index++ % sequence.length];
}

const input = {
  id: "replay_character",
  name: "Replay",
  startRegionId: "trung_vuc",
  basePhy: 15,
  baseMag: 16
};
const first = generateCharacter({ ...input, rng: makeRng() });
const second = generateCharacter({ ...input, rng: makeRng() });
first.createdAt = null;
second.createdAt = null;
assert.deepStrictEqual(second, first, "character generator must be deterministic with injected RNG");
const anonymousFirst = generateCharacter({ ...input, id: undefined, rng: makeRng() });
const anonymousSecond = generateCharacter({ ...input, id: undefined, rng: makeRng() });
assert.strictEqual(anonymousSecond.id, anonymousFirst.id, "generated character IDs must also replay deterministically when omitted");
console.log("OK: character generator deterministic replay");
