import React, { useState, useEffect, useRef } from "react";
import { listenToGame } from "../../utils";
import ScratchPad from "./ScratchPad";
import ENDPOINTS from "../../machine/endpoints";

/* ── Design tokens ─────────────────────────────────────────── */
const PAGE_BG = "#0a0a1a";
const GLASS = {
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 16,
  boxShadow: "0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)",
};

// Player accent palettes (dark theme)
const PALETTES = {
  player1: { border: "#7c3aed", bg: "rgba(124,58,237,0.08)", text: "#a78bfa", glow: "rgba(124,58,237,0.3)" },
  player2: { border: "#06b6d4", bg: "rgba(6,182,212,0.08)", text: "#67e8f9", glow: "rgba(6,182,212,0.3)" },
  system:  { border: "#f59e0b", bg: "rgba(245,158,11,0.08)", text: "#fbbf24", glow: "rgba(245,158,11,0.3)" },
};

function GamePage({ send, state }) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [guessError, setGuessError] = useState("");
  const pinRefs = [useRef(), useRef(), useRef(), useRef()];

  const { gameId, playerRole, isMyTurn, gameData } = state.context;
  const [timeLeft, setTimeLeft] = useState(0);
  const expiredRef = useRef(false);
  const isSystemGame = gameData?.isSystemGame || false;

  useEffect(() => {
    const unsubscribe = listenToGame(gameId, (data) => {
      send({ type: "GAME_DATA_CHANGED", data });
    });
    return () => unsubscribe();
  }, [gameId, send]);

  useEffect(() => {
    if (!gameData?.expireAt) return;
    let expireTime = gameData.expireAt;
    if (expireTime?.seconds) expireTime = expireTime.seconds * 1000;
    else if (typeof expireTime === "string") expireTime = new Date(expireTime).getTime();

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((expireTime - Date.now()) / 1000));
      setTimeLeft(diff);
      if (diff === 0 && !expiredRef.current && gameData?.gameStatus === "ongoing") {
        expiredRef.current = true;
        fetch(ENDPOINTS.EXPIRE_GAME(gameId), { method: "POST" }).catch(() => {});
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [gameData?.expireAt]);

  useEffect(() => {
    if (state.matches("game.idle")) setIsSubmitting(false);
  }, [state]);

  const handlePinChange = (idx, val) => {
    if (!/^[0-9]?$/.test(val)) return;
    const newPin = [...pin];
    newPin[idx] = val;
    setPin(newPin);
    if (val && idx < 3) pinRefs[idx + 1].current?.focus();
    if (!val && idx > 0) pinRefs[idx - 1].current?.focus();
  };

  const handlePinKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !pin[idx] && idx > 0) pinRefs[idx - 1].current?.focus();
    if (e.key === "ArrowLeft" && idx > 0) pinRefs[idx - 1].current?.focus();
    if (e.key === "ArrowRight" && idx < 3) pinRefs[idx + 1].current?.focus();
  };

  const player1Name = gameData?.player1?.name || "Player 1";
  const player2Name = isSystemGame ? "System" : (gameData?.player2?.name || "Player 2");
  const turn = gameData?.turn;
  const player1Turns = gameData?.player1Turns || [];
  const player2Turns = gameData?.player2Turns || [];

  const handleGuess = (e) => {
    e.preventDefault();
    const pinValue = pin.join("");
    if (pinValue.length !== 4) return;
    if (new Set(pinValue).size !== 4) { setGuessError("All digits must be unique."); return; }
    const myTurns = playerRole === "player1" ? player1Turns : player2Turns;
    if (myTurns.some((t) => t.guess === pinValue)) { setGuessError("You already guessed that number."); return; }
    setGuessError("");
    setIsSubmitting(true);
    send({ type: "MAKE_GUESS", guess: pinValue, player: playerRole });
    setPin(["", "", "", ""]);
    pinRefs[0].current?.focus();
  };

  const myNumber = playerRole === "player1" ? gameData?.player1?.number : gameData?.player2?.number;
  const opponentName = playerRole === "player1" ? player2Name : player1Name;
  const myName = playerRole === "player1" ? player1Name : player2Name;
  const opponentRole = playerRole === "player1" ? "player2" : "player1";

  const myPalette = PALETTES[playerRole] || PALETTES.player1;
  const opponentPalette = isSystemGame ? PALETTES.system : (PALETTES[opponentRole] || PALETTES.player2);

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  function renderGuess(guess) {
    if (!guess) return null;
    return guess.toString().split("").map((digit, idx) => (
      <span key={idx} style={{
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 6,
        padding: "3px 8px",
        margin: "0 2px",
        fontWeight: 700,
        background: "rgba(255,255,255,0.06)",
        color: "#f1f5f9",
        fontFamily: "monospace",
        fontSize: 15,
      }}>{digit}</span>
    ));
  }

  const isFinished = gameData?.gameStatus === "finished" || gameData?.gamePhase === "finished";
  let winnerName = null;
  let winnerRole = null;
  if (isFinished) {
    if (gameData?.winner) {
      winnerName = gameData.winner;
      if (gameData.winner === player1Name) winnerRole = "player1";
      else if (gameData.winner === player2Name) winnerRole = "player2";
    } else {
      const lastP1 = player1Turns[player1Turns.length - 1];
      const lastP2 = player2Turns[player2Turns.length - 1];
      if (lastP1?.correct_digits === 4 && lastP1?.correct_positions === 4) { winnerName = player1Name; winnerRole = "player1"; }
      else if (lastP2?.correct_digits === 4 && lastP2?.correct_positions === 4) { winnerName = player2Name; winnerRole = "player2"; }
    }
  }

  const isWinner = winnerRole === playerRole;

  return (
    <div style={{
      minHeight: "100vh",
      width: "100vw",
      backgroundColor: PAGE_BG,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      padding: "20px",
      boxSizing: "border-box",
      fontFamily: "Inter, Segoe UI, system-ui, sans-serif",
      color: "#f1f5f9",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient bg blobs */}
      <div style={{
        position: "fixed", top: "-20%", left: "-10%", width: "50%", height: "50%",
        background: `radial-gradient(circle, ${myPalette.glow} 0%, transparent 70%)`,
        pointerEvents: "none", zIndex: 0, transition: "background 0.6s ease",
      }} />
      <div style={{
        position: "fixed", bottom: "-10%", right: "-10%", width: "45%", height: "45%",
        background: `radial-gradient(circle, ${opponentPalette.glow} 0%, transparent 70%)`,
        pointerEvents: "none", zIndex: 0,
      }} />

      <style>{`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(124,58,237,0.4); }
          70% { box-shadow: 0 0 0 12px rgba(124,58,237,0); }
          100% { box-shadow: 0 0 0 0 rgba(124,58,237,0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .game-flex-row { flex-direction: column !important; gap: 16px !important; align-items: stretch !important; max-width: 98vw !important; }
          .game-panel { min-width: 0 !important; width: 100% !important; }
        }
        @media (max-width: 600px) {
          .game-flex-row { padding: 0 2vw !important; gap: 10px !important; }
          .game-panel { padding: 12px 8px !important; font-size: 0.95rem !important; }
          .game-center { padding: 10px 4px !important; }
        }
        .pin-input:focus { border-color: #7c3aed !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.2) !important; }
        .pin-input::placeholder { color: #334155; }
      `}</style>

      {/* Game ID bar */}
      {!isSystemGame && (
        <div style={{
          ...GLASS,
          padding: "10px 20px",
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontWeight: 600,
          fontSize: 16,
          maxWidth: 400,
          width: "100%",
          justifyContent: "center",
          position: "relative",
          zIndex: 1,
        }}>
          <span style={{ color: "#64748b" }}>Game ID:</span>
          <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 17, color: "#a78bfa", background: "rgba(124,58,237,0.1)", padding: "2px 10px", borderRadius: 6 }}>
            {gameId || "-"}
          </span>
          <button
            style={{
              padding: "4px 12px", borderRadius: 6, border: "1px solid rgba(124,58,237,0.3)",
              background: "rgba(124,58,237,0.1)", cursor: "pointer", fontWeight: 600,
              color: "#a78bfa", fontSize: 13, transition: "background 0.2s",
            }}
            onClick={() => {
              if (gameId) {
                const joinUrl = `${window.location.origin}/join?gameId=${gameId}`;
                navigator.clipboard.writeText(joinUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
              }
            }}
          >
            {copied ? "✓ Copied!" : "Copy Link"}
          </button>
        </div>
      )}

      {/* Scratchpad */}
      <div style={{ width: "100%", display: "flex", justifyContent: "center", marginBottom: 12, position: "relative", zIndex: 1 }}>
        <ScratchPad onFillGuess={(guess) => { setPin(guess.split("")); pinRefs[0].current?.focus(); }} />
      </div>

      {/* Waiting banner */}
      {gameData?.gameStatus === "waiting_for_player2" && !isSystemGame && (
        <div style={{
          ...GLASS,
          padding: "12px 24px",
          marginBottom: 16,
          fontWeight: 600,
          fontSize: 16,
          textAlign: "center",
          maxWidth: 420,
          color: "#fbbf24",
          borderColor: "rgba(245,158,11,0.3)",
          position: "relative",
          zIndex: 1,
        }}>
          ⏳ Waiting for the other player to join...
        </div>
      )}

      {/* Winner/loser banner */}
      {isFinished && (
        <div style={{
          width: "100%",
          maxWidth: 900,
          margin: "0 auto 24px auto",
          background: isWinner
            ? "linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(6,182,212,0.2) 100%)"
            : winnerRole
            ? "linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(124,58,237,0.15) 100%)"
            : "rgba(255,255,255,0.05)",
          border: `1px solid ${isWinner ? "rgba(16,185,129,0.4)" : winnerRole ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: 16,
          padding: "28px 16px",
          textAlign: "center",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          position: "relative",
          zIndex: 1,
        }}>
          <h1 style={{ fontSize: 28, marginBottom: 8, fontWeight: 800, color: isWinner ? "#10b981" : winnerRole ? "#ef4444" : "#94a3b8" }}>
            {isFinished && gameData?.winner === null && !winnerRole
              ? "⏰ Time's up! The game ended in a draw."
              : isWinner
              ? "🎉 Congratulations! You won!"
              : winnerRole
              ? `Better luck next time! ${winnerName} won.`
              : "Game Over!"}
          </h1>
          <button
            onClick={() => send({ type: "GO_TO_HOME" })}
            style={{
              fontSize: 16, padding: "10px 28px", borderRadius: 10,
              background: isWinner
                ? "linear-gradient(135deg,#10b981,#06b6d4)"
                : "linear-gradient(135deg,#ef4444,#7c3aed)",
              color: "#fff", border: "none", marginTop: 8, cursor: "pointer",
              fontWeight: 700, boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            }}
          >
            Exit to Home
          </button>
        </div>
      )}

      {/* Main 3-column layout */}
      <div className="game-flex-row" style={{
        display: "flex", flexDirection: "row", gap: 24,
        alignItems: "flex-start", justifyContent: "center",
        width: "100%", maxWidth: 1200, position: "relative", zIndex: 1,
      }}>
        {/* Left: Me */}
        <div className="game-panel" style={{
          ...GLASS,
          flex: 1,
          padding: 20,
          minWidth: 270,
          borderColor: `${myPalette.border}55`,
          background: myPalette.bg,
        }}>
          <h3 style={{ color: myPalette.text, margin: "0 0 14px 0", fontSize: 17, fontWeight: 700 }}>
            🎯 {myName} <span style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>(You)</span>
          </h3>
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Your Secret Number</div>
            <div style={{ fontSize: 24, letterSpacing: 8, fontWeight: 800, color: myPalette.text, fontFamily: "monospace" }}>
              {myNumber || <span style={{ color: "#334155", letterSpacing: 0 }}>—</span>}
            </div>
          </div>
          <div>
            <div style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              Your Guesses
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {(playerRole === "player1" ? player1Turns : player2Turns).length === 0 && (
                <li style={{ color: "#334155", fontSize: 14 }}>No guesses yet.</li>
              )}
              {(playerRole === "player1" ? player1Turns : player2Turns).map((t, idx) => (
                <li key={idx} style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  {renderGuess(t.guess)}
                  <span style={{ fontSize: 12, color: "#64748b", marginLeft: 4 }}>
                    ✓{t.correct_digits}d / ✓{t.correct_positions}p
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Center: Game controls */}
        <div className="game-center" style={{
          ...GLASS,
          flex: 0.6,
          minWidth: 200,
          textAlign: "center",
          padding: 20,
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14, color: "#f1f5f9" }}>
            {isSystemGame ? "⚔️ vs System AI" : "🎮 Game In Progress"}
          </h2>

          {/* Timer */}
          <div style={{ marginBottom: 14, padding: "10px 16px", background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Timer</div>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "monospace", color: timeLeft < 60 ? "#ef4444" : "#06b6d4", marginTop: 2 }}>
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Turn indicator */}
          <div style={{ marginBottom: 16, minHeight: 44, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Current Turn</div>
            <div style={{ fontSize: 14, color: "#94a3b8" }}>
              {turn === "player1" ? `${player1Name}` : turn === "player2" ? `${player2Name}${isSystemGame ? " (AI)" : ""}` : "—"}
            </div>
            {isMyTurn && !isSubmitting && (
              <span style={{
                background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                color: "#fff", fontWeight: 700, fontSize: 14,
                borderRadius: 20, padding: "5px 16px",
                animation: "pulse-ring 1.5s infinite",
              }}>
                Your Turn!
              </span>
            )}
            {isSubmitting && (
              <span style={{
                background: "rgba(124,58,237,0.2)", color: "#a78bfa",
                fontWeight: 600, fontSize: 13, borderRadius: 20, padding: "5px 14px",
                border: "1px solid rgba(124,58,237,0.3)",
              }}>
                ✅ Validating...
              </span>
            )}
            {!isMyTurn && turn === "player2" && isSystemGame && !isSubmitting && (
              <span style={{
                background: "rgba(245,158,11,0.15)", color: "#fbbf24",
                fontWeight: 600, fontSize: 13, borderRadius: 20, padding: "5px 14px",
                border: "1px solid rgba(245,158,11,0.3)",
              }}>
                🤖 AI Thinking...
              </span>
            )}
          </div>

          {/* Guess form */}
          {!isFinished && (
            <form onSubmit={handleGuess} style={{ marginBottom: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }} autoComplete="off">
              <div style={{ display: "flex", gap: 8 }}>
                {pin.map((digit, idx) => (
                  <input
                    key={idx}
                    className="pin-input"
                    ref={pinRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => { setGuessError(""); handlePinChange(idx, e.target.value); }}
                    onKeyDown={(e) => handlePinKeyDown(idx, e)}
                    disabled={!isMyTurn || isSubmitting}
                    style={{
                      width: 40, height: 48,
                      fontSize: 26, textAlign: "center",
                      border: "1.5px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      background: (isMyTurn && !isSubmitting) ? "rgba(124,58,237,0.1)" : "rgba(255,255,255,0.03)",
                      outline: "none",
                      fontWeight: 700, color: "#f1f5f9",
                      transition: "border 0.2s, box-shadow 0.2s",
                      fontFamily: "monospace",
                    }}
                    autoComplete="off"
                    name={`pin-${idx}`}
                  />
                ))}
              </div>
              {guessError && (
                <div style={{ color: "#f59e0b", fontSize: 13, fontWeight: 500 }}>⚠️ {guessError}</div>
              )}
              <button
                type="submit"
                disabled={!isMyTurn || isSubmitting || pin.join("").length !== 4}
                style={{
                  fontSize: 15, padding: "9px 24px", borderRadius: 8,
                  background: (isMyTurn && !isSubmitting && pin.join("").length === 4)
                    ? "linear-gradient(135deg, #7c3aed, #06b6d4)"
                    : "rgba(255,255,255,0.06)",
                  color: (isMyTurn && !isSubmitting && pin.join("").length === 4) ? "#fff" : "#4b5563",
                  border: "none", fontWeight: 700,
                  cursor: (isMyTurn && !isSubmitting && pin.join("").length === 4) ? "pointer" : "not-allowed",
                  boxShadow: (isMyTurn && !isSubmitting && pin.join("").length === 4) ? "0 4px 16px rgba(124,58,237,0.3)" : "none",
                  transition: "background 0.2s, box-shadow 0.2s",
                }}
              >
                {isSubmitting ? "Submitting..." : "Submit Guess"}
              </button>
            </form>
          )}

          <button
            onClick={() => send({ type: "GO_TO_HOME" })}
            style={{
              fontSize: 13, padding: "6px 16px", borderRadius: 8,
              background: "rgba(239,68,68,0.1)", color: "#f87171",
              border: "1px solid rgba(239,68,68,0.25)", cursor: "pointer", fontWeight: 600,
              transition: "background 0.2s",
            }}
          >
            Exit to Home
          </button>
        </div>

        {/* Right: Opponent */}
        <div className="game-panel" style={{
          ...GLASS,
          flex: 1,
          padding: 20,
          minWidth: 270,
          borderColor: `${opponentPalette.border}55`,
          background: opponentPalette.bg,
        }}>
          <h3 style={{ color: opponentPalette.text, margin: "0 0 14px 0", fontSize: 17, fontWeight: 700 }}>
            {isSystemGame ? "🤖" : "🎯"} {opponentName}
          </h3>
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Opponent's Number</div>
            <div style={{ fontSize: 20, color: "#334155", fontWeight: 700 }}>🔒 Hidden</div>
          </div>
          <div>
            <div style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              {opponentName}'s Guesses
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {(playerRole === "player1" ? player2Turns : player1Turns).length === 0 && (
                <li style={{ color: "#334155", fontSize: 14 }}>No guesses yet.</li>
              )}
              {(playerRole === "player1" ? player2Turns : player1Turns).map((t, idx) => (
                <li key={idx} style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  {renderGuess(t.guess)}
                  <span style={{ fontSize: 12, color: "#64748b", marginLeft: 4 }}>
                    ✓{t.correct_digits}d / ✓{t.correct_positions}p
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GamePage;
