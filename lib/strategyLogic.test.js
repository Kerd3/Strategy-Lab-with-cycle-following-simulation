import test from "node:test";
import assert from "node:assert/strict";
import { BOX_COUNT } from "./gameLogic.js";
import {
  analyzeCycleStrategy,
  createCycleWalkthrough,
  getCycleLengths,
  getCycleStrategySuccessProbability,
  getRandomSearchSuccessProbability,
  simulateStrategyLab,
} from "./strategyLogic.js";

const identityPermutation = () => Array.from({ length: BOX_COUNT }, (_, index) => index + 1);

function permutationWithCycle(cycleLength) {
  const contents = identityPermutation();
  for (let index = 0; index < cycleLength; index += 1) {
    contents[index] = index === cycleLength - 1 ? 1 : index + 2;
  }
  return contents;
}

test("cycle analysis finds the cycle lengths of a permutation", () => {
  const contents = identityPermutation();
  contents[0] = 2;
  contents[1] = 1;
  contents[2] = 4;
  contents[3] = 3;

  assert.deepEqual(getCycleLengths(contents), [2, 2, ...Array(96).fill(1)]);
  assert.equal(analyzeCycleStrategy(contents).success, true);
});

test("cycle-following strategy succeeds when all cycles are at most 50", () => {
  assert.equal(analyzeCycleStrategy(identityPermutation()).success, true);
  assert.equal(analyzeCycleStrategy(permutationWithCycle(50)).success, true);
});

test("cycle-following strategy fails when a cycle exceeds 50 boxes", () => {
  const result = analyzeCycleStrategy(permutationWithCycle(51));
  assert.equal(result.longestCycle, 51);
  assert.equal(result.success, false);
});

test("walkthrough follows the number revealed to the next box and stops on a match", () => {
  const contents = identityPermutation();
  // Swap the contents of boxes 42 and 7 to create a 2-cycle.
  contents[41] = 7;
  contents[6] = 42;

  const walkthrough = createCycleWalkthrough(contents, 42);
  assert.deepEqual(walkthrough.path, [
    { boxNumber: 42, revealedNumber: 7 },
    { boxNumber: 7, revealedNumber: 42 },
  ]);
  assert.equal(walkthrough.found, true);
});

test("walkthrough stops after the attempt limit when target is not found", () => {
  const contents = permutationWithCycle(51);
  const walkthrough = createCycleWalkthrough(contents, 1, 50);
  assert.equal(walkthrough.path.length, 50);
  assert.equal(walkthrough.found, false);
  assert.equal(walkthrough.stoppedByLimit, true);
});

test("theoretical probabilities are in the expected ranges", () => {
  const cycleProbability = getCycleStrategySuccessProbability();
  const randomProbability = getRandomSearchSuccessProbability();
  assert.ok(cycleProbability > 0.31 && cycleProbability < 0.32);
  assert.ok(randomProbability > 0 && randomProbability < 1e-29);
});

test("simulation reports rates and counts within the batch size", () => {
  const result = simulateStrategyLab(12, () => 0.5);
  assert.equal(result.rounds, 12);
  assert.ok(result.cycleWins >= 0 && result.cycleWins <= 12);
  assert.ok(result.randomWins >= 0 && result.randomWins <= 12);
  assert.ok(result.cycleWinRate >= 0 && result.cycleWinRate <= 1);
  assert.ok(result.randomWinRate >= 0 && result.randomWinRate <= 1);
  assert.ok(result.averageLongestCycle >= 1 && result.averageLongestCycle <= 100);
});
