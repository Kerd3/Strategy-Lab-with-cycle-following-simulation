import test from "node:test";
import assert from "node:assert/strict";
import { BOX_COUNT, MAX_ATTEMPTS, createGame, createPermutation, getGameResult } from "./gameLogic.js";

test("permutation contains every number from 1 to 100 exactly once", () => {
  const contents = createPermutation(() => 0.42);
  assert.equal(contents.length, BOX_COUNT);
  assert.deepEqual([...contents].sort((a, b) => a - b), Array.from({ length: BOX_COUNT }, (_, i) => i + 1));
});

test("new game selects a valid prisoner number and 100 box contents", () => {
  const game = createGame(() => 0.5);
  assert.ok(game.targetNumber >= 1 && game.targetNumber <= BOX_COUNT);
  assert.equal(game.contents.length, BOX_COUNT);
});

test("game is won when an opened box contains the assigned number", () => {
  const contents = Array.from({ length: BOX_COUNT }, (_, i) => i + 1);
  assert.deepEqual(getGameResult({ targetNumber: 42, contents, openedIndexes: [0, 41] }), {
    status: "won",
    foundIndex: 41,
  });
});

test("game is lost after 50 misses", () => {
  const contents = Array.from({ length: BOX_COUNT }, (_, i) => i + 1);
  const openedIndexes = Array.from({ length: MAX_ATTEMPTS }, (_, i) => i);
  assert.deepEqual(getGameResult({ targetNumber: 100, contents, openedIndexes }), {
    status: "lost",
    foundIndex: null,
  });
});

test("game continues while attempts remain and target has not been found", () => {
  const contents = Array.from({ length: BOX_COUNT }, (_, i) => i + 1);
  assert.deepEqual(getGameResult({ targetNumber: 100, contents, openedIndexes: [0, 4, 7] }), {
    status: "playing",
    foundIndex: null,
  });
});
