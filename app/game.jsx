"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BOX_COUNT, MAX_ATTEMPTS, createGame, getGameResult } from "../lib/gameLogic.js";

function BoxIcon({ open = false }) {
  return (
    <svg className={`box-illustration ${open ? "is-open" : ""}`} viewBox="0 0 54 50" aria-hidden="true">
      <g className="box-lid">
        <path d="M7 17 12 6h30l5 11-20 8L7 17Z" />
        <path d="m7 17 20 8 20-8" />
      </g>
      <path className="box-body" d="M7 18 27 26 47 18v23L27 48 7 41V18Z" />
      <path className="box-detail" d="M27 26v22M19 23v9h16v-9" />
      <path className="box-shine" d="m12 20 10 4" />
    </svg>
  );
}

function Prisoner({ moving }) {
  return (
    <svg className={`prisoner-art ${moving ? "is-walking" : ""}`} viewBox="0 0 46 64" role="img" aria-label="Prisoner walking to a box">
      <ellipse cx="23" cy="60" rx="15" ry="3" fill="rgba(0,0,0,.22)" />
      <g className="prisoner-body">
        <path d="M16 39 13 55" className="leg leg-left" />
        <path d="M29 39 33 55" className="leg leg-right" />
        <path d="M10 56h7M30 56h7" className="shoe" />
        <path d="M14 23Q23 19 32 23L34 42Q23 47 12 42L14 23Z" className="uniform" />
        <path d="M14 27 32 31M13 34l20 4M13 41l19 1" className="uniform-stripe" />
        <path d="M14 26 8 38M32 26l6 12" className="arm" />
        <path d="M18 20h10v8H18z" className="neck" />
        <ellipse cx="23" cy="13" rx="9" ry="10" className="face" />
        <path d="M14 12Q14 2 23 3q10 0 10 9l-3-4q-6 3-14 0Z" className="hair" />
        <circle cx="20" cy="14" r="1" className="eye" />
        <circle cx="27" cy="14" r="1" className="eye" />
        <path d="M20 18q3 2 6 0" className="smile" />
      </g>
    </svg>
  );
}

export default function Game({ initialGame }) {
  const [game, setGame] = useState(() => initialGame);
  const [opened, setOpened] = useState({});
  const [attempts, setAttempts] = useState(0);
  const [phase, setPhase] = useState("playing");
  const [lastReveal, setLastReveal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actorPosition, setActorPosition] = useState(null);
  const [actorVisible, setActorVisible] = useState(true);
  const [travelPath, setTravelPath] = useState(null);
  const [round, setRound] = useState(1);
  const boardWrapRef = useRef(null);
  const gridRef = useRef(null);
  const boxRefs = useRef([]);
  const timeoutRef = useRef(null);
  const actorHideRef = useRef(null);

  const openedIndexes = Object.keys(opened).map(Number);
  const attemptsLeft = MAX_ATTEMPTS - attempts;
  const openedCount = openedIndexes.length;
  const hitIndex = phase === "won" ? Number(lastReveal?.index) : -1;

  const startNewGame = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    if (actorHideRef.current) window.clearTimeout(actorHideRef.current);
    setGame(createGame());
    setOpened({});
    setAttempts(0);
    setPhase("playing");
    setLastReveal(null);
    setBusy(false);
    setActorPosition(null);
    setActorVisible(true);
    setTravelPath(null);
    setRound((current) => current + 1);
  }, []);

  useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    if (actorHideRef.current) window.clearTimeout(actorHideRef.current);
  }, []);

  const chooseBox = (index) => {
    if (phase !== "playing" || busy || opened[index] !== undefined) return;

    const wrapper = boardWrapRef.current;
    const grid = gridRef.current;
    const boxElement = boxRefs.current[index];
    if (!wrapper || !grid || !boxElement) return;

    const wrapperRect = wrapper.getBoundingClientRect();
    const boxRect = boxElement.getBoundingClientRect();
    const targetX = boxRect.left - wrapperRect.left + boxRect.width / 2 - 13;
    const targetY = boxRect.top - wrapperRect.top + boxRect.height / 2 - 22;
    // After the first opening, travel starts from the previous box. At round start,
    // the prisoner begins at Point A beneath the grid.
    const startX = actorPosition ? actorPosition.x + 13 : 18;
    const startY = actorPosition ? actorPosition.y + 22 : Math.max(10, grid.offsetHeight + 18);
    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight;
    const controlX1 = startX + (targetX - startX) * 0.16;
    const controlY1 = startY - Math.min(100, Math.max(38, (startY - targetY) * 0.16));
    const controlX2 = startX + (targetX - startX) * 0.82;
    const controlY2 = targetY + Math.min(100, Math.max(30, (startY - targetY) * 0.14));
    const d = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${targetX + 13} ${targetY + 22}`;

    const newAttempts = attempts + 1;
    const value = game.contents[index];
    const nextOpened = { ...opened, [index]: value };
    const result = getGameResult({
      targetNumber: game.targetNumber,
      contents: game.contents,
      openedIndexes: Object.keys(nextOpened).map(Number),
    });

    setAttempts(newAttempts);
    setBusy(true);
    setActorVisible(true);
    setActorPosition({ x: targetX, y: targetY });
    setTravelPath({ d, width, height });
    setLastReveal({ index, value, isMatch: value === game.targetNumber });

    timeoutRef.current = window.setTimeout(() => {
      setOpened(nextOpened);
      setPhase(result.status);
      setBusy(false);
      setTravelPath(null);
      setActorVisible(false);
    }, 650);
  };

  const statusText = phase === "won"
    ? "You found your number!"
    : phase === "lost"
      ? "Your 50 attempts are up."
      : busy
        ? "The prisoner is on the move…"
        : lastReveal
          ? lastReveal.isMatch
            ? "That’s your number!"
            : `Box ${String(lastReveal.index + 1).padStart(2, "0")} revealed ${lastReveal.value}.`
          : "Choose a box to begin your search.";

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="The Box Ward home">
          <span className="brand-mark"><BoxIcon /></span>
          <span className="brand-copy"><strong>THE BOX WARD</strong><small>THE PRISONER PUZZLE</small></span>
        </a>
        <nav className="topbar-right strategy-topnav" aria-label="Game modes">
          <Link className="mode-link active" href="/" aria-current="page">CLASSIC MODE</Link>
          <Link className="mode-link" href="/strategy-lab">STRATEGY LAB ↗</Link>
          <span className="round-label">ROUND <strong>{String(round).padStart(2, "0")}</strong></span>
        </nav>
      </header>

      <main id="top">
        <section className="intro-row">
          <div className="intro-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> LOGIC CHALLENGE <span className="eyebrow-separator">/</span> 100 BOXES</div>
            <h1>Find your number.<br /><em>Beat the odds.</em></h1>
            <p className="intro-description">One number is yours. One hundred boxes stand between you and freedom. Choose carefully — you only get 50 openings.</p>
          </div>
          <div className="intro-stamp" aria-hidden="true">
            <div className="stamp-ring"><span>100</span><small>BOXES</small><i>✳</i><b>50</b><small>TRIES</small></div>
          </div>
        </section>

        <section className="game-layout" aria-label="Prisoner box game">
          <div className="board-panel panel">
            <div className="panel-heading">
              <div>
                <div className="section-kicker">THE SEARCH ROOM</div>
                <h2>Choose a box</h2>
              </div>
              <div className="boxes-opened"><span className="open-indicator" /> <strong>{String(openedCount).padStart(2, "0")}</strong><span> / 100 OPENED</span></div>
            </div>

            <div className="status-strip" role="status" aria-live="polite">
              <span className={`status-symbol ${phase === "won" ? "success" : phase === "lost" ? "failure" : busy ? "moving" : ""}`}>
                {phase === "won" ? "✓" : phase === "lost" ? "!" : busy ? "↗" : "i"}
              </span>
              <span>{statusText}</span>
              {phase === "playing" && <span className="status-hint">{busy ? "PLEASE WAIT" : "SELECT ANY CLOSED BOX"}</span>}
            </div>

            <div className="grid-scroll">
              <div className="board-wrap" ref={boardWrapRef}>
                {travelPath && (
                  <svg className="travel-svg" width="100%" height="100%" viewBox={`0 0 ${travelPath.width} ${travelPath.height}`} preserveAspectRatio="none" aria-hidden="true">
                    <path className="travel-path" d={travelPath.d} />
                  </svg>
                )}
                <div className="box-grid" ref={gridRef}>
                  {Array.from({ length: BOX_COUNT }, (_, index) => {
                    const value = opened[index];
                    const isOpen = value !== undefined;
                    const isMatch = isOpen && value === game.targetNumber;
                    const isFailedTarget = phase === "lost" && game.contents[index] === game.targetNumber;
                    return (
                      <button
                        key={index}
                        ref={(element) => { boxRefs.current[index] = element; }}
                        type="button"
                        className={`box-cell ${isOpen ? "opened" : ""} ${isMatch ? "matched" : ""} ${isFailedTarget ? "target-reveal" : ""}`}
                        onClick={() => chooseBox(index)}
                        disabled={phase !== "playing" || busy || isOpen}
                        aria-label={isOpen ? `Box ${index + 1}, contains ${value}${isMatch ? ", target found" : ""}` : `Open box ${index + 1}`}
                      >
                        <span className="box-index">{String(index + 1).padStart(2, "0")}</span>
                        <span className="box-art-wrap"><BoxIcon open={isOpen} /></span>
                        <span className="box-value">{isOpen ? String(value).padStart(2, "0") : "OPEN"}</span>
                        {isMatch && <span className="match-check" aria-label="Target found">✓</span>}
                      </button>
                    );
                  })}
                </div>
                <div
                  className={`walker ${busy ? "is-moving" : ""} ${actorVisible ? "is-visible" : "is-hidden"}`}
                  style={actorPosition ? { left: actorPosition.x, top: actorPosition.y } : undefined}
                  aria-hidden="true"
                >
                  <Prisoner moving={busy} />
                </div>
                <div className="start-marker" aria-hidden="true"><span className="start-marker-dot" /><span>POINT A</span></div>
              </div>
            </div>

            <div className="board-legend">
              <span><i className="legend-box closed-legend"><BoxIcon /></i> CLOSED BOX</span>
              <span><i className="legend-box opened-legend"><BoxIcon open /></i> OPENED · CONTENT VISIBLE</span>
              <span><i className="legend-dot" /> YOUR NUMBER</span>
            </div>
          </div>

          <aside className="mission-column">
            <section className="mission-card panel">
              <div className="mission-topline"><span className="section-kicker">YOUR ASSIGNMENT</span><span className="prisoner-number">NO. {String(game.targetNumber).padStart(3, "0")}</span></div>
              <div className="target-label">FIND THE NUMBER</div>
              <div className="target-number">{String(game.targetNumber).padStart(2, "0")}</div>
              <div className="target-caption">PRISONER ID</div>
              <div className="mission-rule"><span className="rule-icon">↳</span><p>Find the box containing <strong>{game.targetNumber}</strong>. The number on the front is only the box’s label — its contents are random.</p></div>
              <div className="attempt-meter-heading"><span>ATTEMPTS REMAINING</span><strong className={attemptsLeft <= 10 ? "danger-text" : ""}>{attemptsLeft}<small> / 50</small></strong></div>
              <div className="attempt-meter" aria-label={`${attemptsLeft} attempts remaining`}>
                {Array.from({ length: MAX_ATTEMPTS }, (_, index) => <i key={index} className={index < attempts ? "spent" : ""} />)}
              </div>
              <div className="attempt-foot"><span>{attempts} USED</span><span>{Math.round((attempts / MAX_ATTEMPTS) * 100)}% OF LIMIT</span></div>
              <button className="new-game-button" type="button" onClick={startNewGame}>
                <span className="new-game-icon">↻</span> NEW GAME <span className="button-arrow">↗</span>
              </button>
            </section>

            <section className="rules-card panel">
              <div className="rules-heading"><span className="rules-icon">✳</span><h3>How to play</h3></div>
              <ol className="rules-list">
                <li><span>01</span><p>Open any box to reveal the number hidden inside.</p></li>
                <li><span>02</span><p>Opened boxes stay open. Their contents will remain visible.</p></li>
                <li><span>03</span><p>Find your assigned number in 50 openings to win.</p></li>
              </ol>
              <div className="rules-foot"><span className="rules-foot-icon">↗</span><p>Every new game reshuffles all 100 numbers.</p></div>
            </section>
          </aside>
        </section>

        {phase !== "playing" && (
          <section className={`result-banner ${phase === "won" ? "win-banner" : "lose-banner"}`} role="alert">
            <div className="result-emblem">{phase === "won" ? "✦" : "×"}</div>
            <div className="result-copy">
              <span className="section-kicker">ROUND {String(round).padStart(2, "0")} COMPLETE</span>
              <h2>{phase === "won" ? "Freedom found." : "The search is over."}</h2>
              <p>{phase === "won" ? `You found ${game.targetNumber} in ${attempts} ${attempts === 1 ? "attempt" : "attempts"}. Nicely done.` : `The number ${game.targetNumber} was in box ${game.contents.indexOf(game.targetNumber) + 1}. Try a fresh round and see if you can do better.`}</p>
            </div>
            <button type="button" className="result-button" onClick={startNewGame}>PLAY AGAIN <span>↗</span></button>
          </section>
        )}

        <footer className="page-footer"><span>THE BOX WARD <i>©</i> 2026</span><span>A SOLO TAKE ON THE 100 PRISONERS PROBLEM</span><span>THINK BEFORE YOU OPEN.</span></footer>
      </main>
    </div>
  );
}

