import { BOX_COUNT, MAX_ATTEMPTS, createPermutation } from "./gameLogic.js";

/** Return the length of every disjoint cycle in a permutation of 1..n. */
export function getCycleLengths(contents) {
  const visited = Array(contents.length).fill(false);
  const lengths = [];

  for (let start = 0; start < contents.length; start += 1) {
    if (visited[start]) continue;

    let current = start;
    let length = 0;

    while (!visited[current]) {
      visited[current] = true;
      length += 1;
      current = contents[current] - 1;
    }

    lengths.push(length);
  }

  return lengths;
}

/** Analyze whether the cycle-following strategy saves every prisoner. */
export function analyzeCycleStrategy(contents, maxAttempts = MAX_ATTEMPTS) {
  const cycleLengths = getCycleLengths(contents);
  const longestCycle = cycleLengths.length ? Math.max(...cycleLengths) : 0;

  return {
    cycleLengths,
    longestCycle,
    success: longestCycle <= maxAttempts,
  };
}

/**
 * Build the sequence a prisoner follows: open their own numbered box, then
 * open the box named by the number just revealed. The path stops on a match
 * or when the attempt limit is reached.
 */
export function createCycleWalkthrough(contents, prisonerNumber, maxAttempts = MAX_ATTEMPTS) {
  const path = [];
  let boxNumber = prisonerNumber;

  while (path.length < Math.min(maxAttempts, contents.length)) {
    const revealedNumber = contents[boxNumber - 1];
    path.push({ boxNumber, revealedNumber });

    if (revealedNumber === prisonerNumber) {
      return { prisonerNumber, path, found: true, stoppedByLimit: false };
    }

    boxNumber = revealedNumber;
  }

  return {
    prisonerNumber,
    path,
    found: false,
    stoppedByLimit: path.length >= maxAttempts,
  };
}

/**
 * Exact success probability for the classic 100-box, 50-attempt puzzle.
 * A random permutation fails iff it contains a cycle of length 51..100.
 * Those cycle events are mutually exclusive, and a random permutation has
 * expected 1/k cycles of length k, so P(success) = 1 - sum(1/k, k=51..100).
 */
export function getCycleStrategySuccessProbability() {
  let probability = 1;
  for (let cycleLength = MAX_ATTEMPTS + 1; cycleLength <= BOX_COUNT; cycleLength += 1) {
    probability -= 1 / cycleLength;
  }
  return probability;
}

/** With independent random choices, each prisoner succeeds with probability 1/2. */
export function getRandomSearchSuccessProbability() {
  return (MAX_ATTEMPTS / BOX_COUNT) ** BOX_COUNT;
}

/** Simulate independent rounds of both strategies. */
export function simulateStrategyLab(rounds, random = Math.random) {
  if (!Number.isInteger(rounds) || rounds < 1) {
    throw new RangeError("Rounds must be a positive integer.");
  }

  let cycleWins = 0;
  let randomWins = 0;
  let totalLongestCycle = 0;
  let longestCycleSeen = 0;

  for (let round = 0; round < rounds; round += 1) {
    const contents = createPermutation(random);
    const cycleResult = analyzeCycleStrategy(contents);
    if (cycleResult.success) cycleWins += 1;
    totalLongestCycle += cycleResult.longestCycle;
    longestCycleSeen = Math.max(longestCycleSeen, cycleResult.longestCycle);

    // The target number's position in a random set of 50 distinct boxes is
    // uniformly distributed across 1..100. Model each prisoner's search with
    // one equivalent random position; all 100 must land in positions <= 50.
    let everyoneSucceeded = true;
    for (let prisoner = 0; prisoner < BOX_COUNT; prisoner += 1) {
      const targetPosition = Math.floor(random() * BOX_COUNT) + 1;
      if (targetPosition > MAX_ATTEMPTS) {
        everyoneSucceeded = false;
        break;
      }
    }
    if (everyoneSucceeded) randomWins += 1;
  }

  return {
    rounds,
    cycleWins,
    randomWins,
    cycleWinRate: cycleWins / rounds,
    randomWinRate: randomWins / rounds,
    averageLongestCycle: totalLongestCycle / rounds,
    longestCycleSeen,
    cycleTheoreticalProbability: getCycleStrategySuccessProbability(),
    randomTheoreticalProbability: getRandomSearchSuccessProbability(),
  };
}
