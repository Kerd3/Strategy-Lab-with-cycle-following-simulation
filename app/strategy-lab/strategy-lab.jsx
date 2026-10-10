"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BOX_COUNT, MAX_ATTEMPTS, createPermutation } from "../../lib/gameLogic.js";
import {
  createCycleWalkthrough,
  getCycleStrategySuccessProbability,
  getRandomSearchSuccessProbability,
  simulateStrategyLab,
} from "../../lib/strategyLogic.js";

const BATCH_OPTIONS = [
  { label: "100 rounds", value: 100 },
  { label: "1,000 rounds", value: 1000 },
  { label: "10,000 rounds", value: 10000 },
];

function toSuperscript(value) {
  const superscriptDigits = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  return String(value).split("").map((character) => superscriptDigits[character] ?? character).join("");
}

function formatScientific(value) {
  const [mantissa, exponent] = value.toExponential(2).split("e");
  return `${mantissa} × 10${toSuperscript(Number(exponent))}`;
}

function BoxWardMark() {
  return (
    <svg className="box-illustration" viewBox="0 0 54 50" aria-hidden="true">
      <path d="M7 17 12 6h30l5 11-20 8L7 17Z" fill="#273227" stroke="#273227" strokeWidth="1.3" />
      <path d="M7 18 27 26 47 18v23L27 48 7 41V18Z" fill="#273227" stroke="#273227" strokeWidth="1.3" />
      <path d="M27 26v22M19 23v9h16v-9" fill="none" stroke="#d4f178" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PageHeader() {
  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="The Box Ward home">
        <span className="brand-mark"><BoxWardMark /></span>
        <span className="brand-copy"><strong>THE BOX WARD</strong><small>THE PRISONER PUZZLE</small></span>
      </Link>
      <nav className="topbar-right strategy-topnav" aria-label="Game modes">
        <Link className="mode-link" href="/">CLASSIC MODE</Link>
        <Link className="mode-link active" href="/strategy-lab" aria-current="page">STRATEGY LAB</Link>
      </nav>
    </header>
  );
}

function ProbabilityCard({ className, eyebrow, value, title, description }) {
  return (
    <article className={`probability-card panel ${className}`}>
      <div className="probability-card-top"><span className="section-kicker">{eyebrow}</span><span className="probability-spark" aria-hidden="true">✳</span></div>
      <div className="probability-value">{value}</div>
      <h2>{title}</h2>
      <p>{description}</p>
    </article>
  );
}

export default function StrategyLab({ initialContents }) {
  const [roundCount, setRoundCount] = useState(1000);
  const [simulation, setSimulation] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [contents, setContents] = useState(initialContents);
  const [prisonerNumber, setPrisonerNumber] = useState(42);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [isAutoWalking, setIsAutoWalking] = useState(false);
  const simulationTimerRef = useRef(null);

  const cycleProbability = getCycleStrategySuccessProbability();
  const randomProbability = getRandomSearchSuccessProbability();
  const walkthrough = useMemo(
    () => createCycleWalkthrough(contents, prisonerNumber),
    [contents, prisonerNumber],
  );
  const revealedSteps = useMemo(
    () => walkthrough.path.slice(0, visibleSteps),
    [walkthrough.path, visibleSteps],
  );
  const revealedBoxes = useMemo(
    () => new Map(revealedSteps.map((step) => [step.boxNumber, step.revealedNumber])),
    [revealedSteps],
  );
  const activeBox = revealedSteps.length ? revealedSteps[revealedSteps.length - 1].boxNumber : null;
  const walkthroughComplete = visibleSteps >= walkthrough.path.length;
  const lastStep = revealedSteps.length ? revealedSteps[revealedSteps.length - 1] : null;

  useEffect(() => {
    if (!isAutoWalking) return undefined;
    if (visibleSteps >= walkthrough.path.length) {
      const finishTimer = window.setTimeout(() => setIsAutoWalking(false), 0);
      return () => window.clearTimeout(finishTimer);
    }

    const timer = window.setTimeout(() => {
      setVisibleSteps((current) => Math.min(current + 1, walkthrough.path.length));
    }, 820);
    return () => window.clearTimeout(timer);
  }, [isAutoWalking, visibleSteps, walkthrough.path.length]);

  useEffect(() => () => {
    if (simulationTimerRef.current) window.clearTimeout(simulationTimerRef.current);
  }, []);

  const runSimulation = () => {
    if (simulationTimerRef.current) window.clearTimeout(simulationTimerRef.current);
    setIsSimulating(true);
    simulationTimerRef.current = window.setTimeout(() => {
      setSimulation(simulateStrategyLab(roundCount));
      setIsSimulating(false);
      simulationTimerRef.current = null;
    }, 40);
  };

  const resetWalkthrough = () => {
    setIsAutoWalking(false);
    setVisibleSteps(0);
  };

  const makeNewPermutation = () => {
    setIsAutoWalking(false);
    setVisibleSteps(0);
    setContents(createPermutation());
  };

  const changePrisoner = (event) => {
    setIsAutoWalking(false);
    setVisibleSteps(0);
    setPrisonerNumber(Number(event.target.value));
  };

  const nextStep = () => {
    setIsAutoWalking(false);
    setVisibleSteps((current) => Math.min(current + 1, walkthrough.path.length));
  };

  const startAutoWalk = () => {
    if (walkthroughComplete) setVisibleSteps(0);
    setIsAutoWalking(true);
  };

  return (
    <div className="app-shell">
      <PageHeader />
      <main id="top" className="strategy-main">
        <section className="intro-row strategy-intro">
          <div className="intro-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> THE MATHEMATICS <span className="eyebrow-separator">/</span> STRATEGY LAB</div>
            <h1>Don’t guess.<br /><em>Follow the cycle.</em></h1>
            <p className="intro-description">One small change to the search strategy turns an impossible-looking puzzle into a surprisingly winnable one. Run simulations and see why.</p>
          </div>
          <div className="strategy-stamp" aria-hidden="true">
            <div className="strategy-stamp-ring"><span>50</span><small>OPENINGS</small><i>✳</i><b>100</b><small>PRISONERS</small></div>
          </div>
        </section>

        <section className="probability-grid" aria-label="Theoretical success probabilities">
          <ProbabilityCard
            className="cycle-probability"
            eyebrow="CYCLE-FOLLOWING"
            value={`${(cycleProbability * 100).toFixed(2)}%`}
            title="Chance everyone survives"
            description="The exact theoretical probability for a random arrangement of 100 numbers, with 50 attempts per prisoner."
          />
          <ProbabilityCard
            className="random-probability"
            eyebrow="INDEPENDENT RANDOM SEARCH"
            value={formatScientific(randomProbability)}
            title="Probability per full round"
            description={`About 1 in ${formatScientific(1 / randomProbability)} rounds. All 100 prisoners must each find their own number.`}
          />
          <article className="probability-card panel attempts-probability">
            <div className="probability-card-top"><span className="section-kicker">THE RULE</span><span className="probability-spark" aria-hidden="true">↳</span></div>
            <div className="probability-value">50 / 100</div>
            <h2>Attempts per prisoner</h2>
            <p>Every prisoner may open no more than half of the boxes. One failure means the group fails.</p>
          </article>
        </section>

        <section className="lab-layout" aria-label="Strategy simulation">
          <div className="simulation-panel panel">
            <div className="panel-heading strategy-panel-heading">
              <div><div className="section-kicker">MONTE CARLO EXPERIMENT</div><h2>Run the numbers</h2></div>
              <span className="simulation-chip"><span className="live-dot" /> SIMULATOR</span>
            </div>
            <p className="strategy-panel-intro">Each round generates a fresh random arrangement. In cycle-following, all 100 prisoners use the same rule. In random search, each prisoner independently chooses 50 boxes.</p>
            <div className="simulation-controls">
              <label htmlFor="round-count">Number of rounds</label>
              <select id="round-count" value={roundCount} onChange={(event) => setRoundCount(Number(event.target.value))} disabled={isSimulating}>
                {BATCH_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <button className="new-game-button simulation-button" type="button" onClick={runSimulation} disabled={isSimulating}>
                <span className="new-game-icon">{isSimulating ? "…" : "↗"}</span> {isSimulating ? "RUNNING SIMULATION" : "RUN SIMULATION"} <span className="button-arrow">↗</span>
              </button>
            </div>

            {!simulation && !isSimulating && (
              <div className="simulation-empty">
                <div className="empty-graphic" aria-hidden="true"><span>01</span><span>50</span><span>100</span><i>↗</i></div>
                <div><strong>Ready when you are.</strong><p>Choose a batch size and run the experiment to compare observed outcomes.</p></div>
              </div>
            )}
            {isSimulating && (
              <div className="simulation-empty simulation-running" role="status" aria-live="polite">
                <span className="simulation-spinner" />
                <div><strong>Simulating {roundCount.toLocaleString()} rounds…</strong><p>Shuffling box contents and evaluating both strategies.</p></div>
              </div>
            )}
            {simulation && !isSimulating && (
              <div className="simulation-results" aria-live="polite">
                <div className="results-heading"><span className="section-kicker">RESULTS · {simulation.rounds.toLocaleString()} ROUNDS</span><button type="button" className="text-button" onClick={runSimulation}>RUN AGAIN ↗</button></div>
                <div className="observed-rate-row">
                  <div className="observed-rate-top"><span className="rate-name"><i className="rate-dot cycle-dot" /> CYCLE-FOLLOWING</span><strong>{(simulation.cycleWinRate * 100).toFixed(2)}%</strong></div>
                  <div className="rate-track"><span className="rate-fill cycle-fill" style={{ width: `${simulation.cycleWinRate * 100}%` }} /></div>
                  <p>{simulation.cycleWins.toLocaleString()} successful rounds out of {simulation.rounds.toLocaleString()} · theory: {(simulation.cycleTheoreticalProbability * 100).toFixed(2)}%</p>
                </div>
                <div className="observed-rate-row">
                  <div className="observed-rate-top"><span className="rate-name"><i className="rate-dot random-dot" /> RANDOM SEARCH</span><strong>{(simulation.randomWinRate * 100).toFixed(2)}%</strong></div>
                  <div className="rate-track"><span className="rate-fill random-fill" style={{ width: `${simulation.randomWinRate * 100}%` }} /></div>
                  <p>{simulation.randomWins.toLocaleString()} successful rounds out of {simulation.rounds.toLocaleString()} · theory: {formatScientific(simulation.randomTheoreticalProbability)}</p>
                </div>
                <div className="result-facts">
                  <div><span>AVERAGE LONGEST CYCLE</span><strong>{simulation.averageLongestCycle.toFixed(1)} <small>boxes</small></strong></div>
                  <div><span>LONGEST CYCLE SEEN</span><strong>{simulation.longestCycleSeen} <small>boxes</small></strong></div>
                </div>
                <p className="simulation-caveat">A simulation estimates probabilities from a finite sample. It is normal for random search to record zero group wins: its theoretical success probability is about one in 1.27 × 10³⁰ rounds.</p>
              </div>
            )}
          </div>

          <aside className="explainer-panel panel">
            <div className="section-kicker">THE CLEVER PART</div>
            <h2>Turn the boxes into a map.</h2>
            <p className="explainer-lede">Every box points to another box: the number inside tells you where to go next. Following those links forms a cycle.</p>
            <ol className="strategy-steps">
              <li><span className="strategy-step-number">01</span><div><strong>Start with your own number</strong><p>Prisoner 42 starts by opening box 42.</p></div></li>
              <li><span className="strategy-step-number">02</span><div><strong>Follow what you find</strong><p>If box 42 contains 17, open box 17 next. Then follow its number.</p></div></li>
              <li><span className="strategy-step-number">03</span><div><strong>Close the loop in 50</strong><p>The prisoner succeeds if the cycle leads back to their number within 50 openings.</p></div></li>
            </ol>
            <div className="explainer-note"><span>✳</span><p>The group succeeds exactly when <strong>every cycle is 50 boxes long or shorter</strong>.</p></div>
          </aside>
        </section>

        <section className="walkthrough-panel panel" aria-labelledby="walkthrough-title">
          <div className="walkthrough-heading">
            <div>
              <div className="section-kicker">INTERACTIVE DEMONSTRATION</div>
              <h2 id="walkthrough-title">Walk one prisoner’s cycle</h2>
              <p>Reveal one box at a time. The number inside each box tells the prisoner which box to open next.</p>
            </div>
            <div className="walkthrough-actions">
              <label className="prisoner-picker-label" htmlFor="prisoner-picker">PRISONER ID</label>
              <select id="prisoner-picker" className="prisoner-picker" value={prisonerNumber} onChange={changePrisoner}>
                {Array.from({ length: BOX_COUNT }, (_, index) => index + 1).map((number) => <option key={number} value={number}>#{String(number).padStart(2, "0")}</option>)}
              </select>
              <button type="button" className="secondary-action" onClick={makeNewPermutation}>NEW PERMUTATION ↻</button>
            </div>
          </div>

          <div className="walk-status-strip" role="status" aria-live="polite">
            <span className={`walk-status-indicator ${walkthroughComplete ? (walkthrough.found ? "success" : "failure") : ""}`} />
            <span>{visibleSteps === 0 ? `Prisoner ${prisonerNumber} is ready to start at box ${prisonerNumber}.` : `Step ${visibleSteps}: box ${lastStep.boxNumber} revealed ${lastStep.revealedNumber}.`}</span>
            <strong>{visibleSteps} / {MAX_ATTEMPTS} OPENINGS</strong>
          </div>

          <div className="walkthrough-body">
            <div className="walkthrough-grid" aria-label="All 100 boxes; opened boxes show the number they contain">
              {Array.from({ length: BOX_COUNT }, (_, index) => {
                const boxNumber = index + 1;
                const isOpened = revealedBoxes.has(boxNumber);
                const value = revealedBoxes.get(boxNumber);
                const isTarget = isOpened && value === prisonerNumber;
                return (
                  <div key={boxNumber} className={`walk-box ${isOpened ? "walk-opened" : ""} ${boxNumber === activeBox ? "walk-current" : ""} ${isTarget ? "walk-target" : ""}`}>
                    <span>{String(boxNumber).padStart(2, "0")}</span>
                    {isOpened && <b>{String(value).padStart(2, "0")}</b>}
                  </div>
                );
              })}
            </div>
            <aside className="walkthrough-sidebar">
              <div className="walk-step-card">
                <div className="walk-step-icon" aria-hidden="true">{walkthroughComplete ? (walkthrough.found ? "✓" : "×") : "↗"}</div>
                <span className="section-kicker">{walkthroughComplete ? "CYCLE RESULT" : "CURRENT STEP"}</span>
                <h3>{walkthroughComplete ? (walkthrough.found ? "Number found." : "Attempt limit reached.") : visibleSteps === 0 ? "Start at your ID." : `Open box ${lastStep.revealedNumber} next.`}</h3>
                <p>{walkthroughComplete
                  ? walkthrough.found
                    ? `Prisoner ${prisonerNumber} found their own number after ${walkthrough.path.length} ${walkthrough.path.length === 1 ? "opening" : "openings"}. This cycle fits within the limit.`
                    : `This cycle did not return to ${prisonerNumber} within 50 openings. Under the rules, this prisoner would fail.`
                  : visibleSteps === 0
                    ? `The first box is always box ${prisonerNumber}, not a random box.`
                    : `Box ${lastStep.boxNumber} contained ${lastStep.revealedNumber}, so follow that number to the next box.`}</p>
                <div className="walk-progress"><span style={{ width: `${(visibleSteps / MAX_ATTEMPTS) * 100}%` }} /></div>
                <div className="walk-progress-label"><span>ATTEMPTS USED</span><strong>{visibleSteps} / 50</strong></div>
              </div>
              <div className="walk-controls">
                <button type="button" className="new-game-button walk-primary-action" onClick={nextStep} disabled={walkthroughComplete}>
                  NEXT STEP <span className="button-arrow">↗</span>
                </button>
                <button type="button" className="secondary-action" onClick={startAutoWalk} disabled={isAutoWalking}>
                  {isAutoWalking ? "WALKING…" : walkthroughComplete ? "REPLAY WALK ↻" : "AUTO-WALK ▶"}
                </button>
                <button type="button" className="secondary-action" onClick={resetWalkthrough}>RESET WALK</button>
              </div>
              <div className="path-trail-heading">PATH SO FAR <span>{revealedSteps.length} BOXES</span></div>
              <div className="path-trail" aria-label="Boxes opened in order">
                {revealedSteps.length === 0
                  ? <span className="path-empty">Your box sequence will appear here.</span>
                  : revealedSteps.map((step, index) => (
                    <span className={`path-chip ${index === revealedSteps.length - 1 ? "path-chip-current" : ""} ${step.revealedNumber === prisonerNumber ? "path-chip-hit" : ""}`} key={`${step.boxNumber}-${index}`}>
                      <b>{String(step.boxNumber).padStart(2, "0")}</b><i>→</i><b>{String(step.revealedNumber).padStart(2, "0")}</b>
                    </span>
                  ))}
              </div>
            </aside>
          </div>
          <div className="walkthrough-legend"><span><i className="walk-legend-square unopened" /> CLOSED BOX</span><span><i className="walk-legend-square opened" /> OPENED BOX</span><span><i className="walk-legend-square current" /> LAST BOX OPENED</span><span><i className="walk-legend-square target" /> TARGET REVEALED</span></div>
        </section>

        <section className="strategy-fact-panel">
          <div className="strategy-fact-mark" aria-hidden="true">∑</div>
          <div><span className="section-kicker">WHY THE RESULT IS ABOUT 31%</span><p>In a random permutation of 100 numbers, the cycle-following group only fails if there is a cycle longer than 50. There can be at most one such cycle, which makes the exact probability easy to calculate: <strong>1 − (1/51 + 1/52 + … + 1/100) ≈ 31.18%</strong>.</p></div>
        </section>

        <footer className="page-footer"><span>THE BOX WARD <i>©</i> 2026</span><span>100 PRISONERS · 100 BOXES · TWO STRATEGIES</span><span><Link href="/">BACK TO CLASSIC MODE ↗</Link></span></footer>
      </main>
    </div>
  );
}
