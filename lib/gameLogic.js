export const BOX_COUNT = 100;
export const MAX_ATTEMPTS = 50;

/** Fisher–Yates shuffle: returns a random permutation of 1..100. */
export function createPermutation(random = Math.random) {
  const numbers = Array.from({ length: BOX_COUNT }, (_, index) => index + 1);

  for (let index = numbers.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [numbers[index], numbers[swapIndex]] = [numbers[swapIndex], numbers[index]];
  }

  return numbers;
}

/** A new game assigns a target prisoner number and randomizes all box contents. */
export function createGame(random = Math.random) {
  return {
    targetNumber: Math.floor(random() * BOX_COUNT) + 1,
    contents: createPermutation(random),
  };
}

export function getGameResult({ targetNumber, contents, openedIndexes }) {
  const foundIndex = openedIndexes.find((index) => contents[index] === targetNumber);
  if (foundIndex !== undefined) return { status: "won", foundIndex };
  if (openedIndexes.length >= MAX_ATTEMPTS) return { status: "lost", foundIndex: null };
  return { status: "playing", foundIndex: null };
}
