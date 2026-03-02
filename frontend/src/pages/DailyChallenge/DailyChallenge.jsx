import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from "../../machine/endpoints";

function formatTime(seconds) {
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}m ${rem.toString().padStart(2, "0")}s` : `${rem}s`;
}

function GuessFeedback({ guesses }) {
  if (!guesses.length) return null;
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
      {guesses.map((g, i) => {
        const wrongPos = g.correct_digits - g.correct_positions;
        const wrong = 4 - g.correct_digits;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: "8px 14px",
            }}
          >
            <span style={{ color: "#64748b", fontSize: "0.8rem", minWidth: 20 }}>
              #{i + 1}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {g.guess.split("").map((d, j) => (
                <span
                  key={j}
                  style={{
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 6,
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "#f1f5f9",
                  }}
                >
                  {d}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 4, marginLeft: 4 }}>
              {Array(g.correct_positions)
                .fill(0)
                .map((_, k) => (
                  <span key={`g${k}`} style={{ color: "#10b981", fontSize: 14 }}>
                    ●
                  </span>
                ))}
              {Array(wrongPos)
                .fill(0)
                .map((_, k) => (
                  <span key={`y${k}`} style={{ color: "#f59e0b", fontSize: 14 }}>
                    ●
                  </span>
                ))}
              {Array(wrong)
                .fill(0)
                .map((_, k) => (
                  <span key={`w${k}`} style={{ color: "#334155", fontSize: 14 }}>
                    ●
                  </span>
                ))}
            </div>
            <span style={{ color: "#64748b", fontSize: "0.75rem", marginLeft: "auto" }}>
              {g.correct_positions}✓&nbsp;{wrongPos}~
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function DailyChallenge() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("name_entry");
  const [playerName, setPlayerName] = useState("");
  const [gameId, setGameId] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [pinDigits, setPinDigits] = useState(["", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeTaken, setTimeTaken] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [gameDate, setGameDate] = useState("");
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];
  const timerRef = useRef(null);

  useEffect(() => {
    if (phase === "playing") {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  async function handleStart(e) {
    e.preventDefault();
    if (!playerName.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINTS.DAILY_CHALLENGE_START, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: playerName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start challenge");
      setGameId(data.game_id);
      setGameDate(data.date);
      setPhase("playing");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGuess(e) {
    e.preventDefault();
    const guess = pinDigits.join("");
    if (guess.length !== 4) {
      setError("Enter all 4 digits");
      return;
    }
    if (new Set(guess).size !== 4) {
      setError("All digits must be unique");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINTS.DAILY_CHALLENGE_GUESS(gameId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit guess");
      setGuesses(data.guesses);
      setPinDigits(["", "", "", ""]);
      setTimeout(() => inputRefs[0].current?.focus(), 0);
      if (data.gameStatus === "finished") {
        clearInterval(timerRef.current);
        setTimeTaken(data.timeTaken ?? elapsed);
        setPhase("finished");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handlePinChange(index, value) {
    if (!/^\d$/.test(value) && value !== "") return;
    const next = [...pinDigits];
    next[index] = value;
    setPinDigits(next);
    if (value && index < 3) inputRefs[index + 1].current?.focus();
  }

  function handlePinKeyDown(index, e) {
    if (e.key === "Backspace" && !pinDigits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  }

  const cardStyle = {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 18,
    boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
    padding: "2rem 1.5rem",
    width: "100%",
    maxWidth: 480,
    boxSizing: "border-box",
  };

  const btnStyle = {
    background: "linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "0.85rem 2rem",
    fontSize: "1rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
    transition: "box-shadow 0.2s, transform 0.12s",
    width: "100%",
    marginTop: 12,
  };

  const ghostBtnStyle = {
    background: "rgba(255,255,255,0.07)",
    color: "#94a3b8",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: "0.5rem 1rem",
    fontSize: "0.88rem",
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a1a",
        color: "#f1f5f9",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem 1rem 3rem",
        fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
        position: "relative",
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Background blobs */}
      <div
        style={{
          position: "fixed",
          top: "-20%",
          left: "-10%",
          width: "55%",
          height: "55%",
          background:
            "radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
          animation: "blobFloat 9s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-10%",
          right: "-10%",
          width: "45%",
          height: "45%",
          background:
            "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
          animation: "blobFloat 12s ease-in-out infinite reverse",
        }}
      />

      {/* Top nav */}
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        <button onClick={() => navigate("/")} style={ghostBtnStyle}>
          ← Home
        </button>
        <button
          onClick={() => navigate("/leaderboard")}
          style={{ ...ghostBtnStyle, color: "#f59e0b" }}
        >
          🏆 Leaderboard
        </button>
      </div>

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem", position: "relative", zIndex: 1 }}>
        <h1
          style={{
            fontSize: "2.2rem",
            fontWeight: 800,
            margin: "0 0 0.25rem",
            background: "linear-gradient(135deg, #fbbf24 0%, #f97316 60%, #a78bfa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Daily Challenge
        </h1>
        <p style={{ color: "#94a3b8", margin: 0, fontSize: "0.95rem" }}>
          Guess today's secret 4-digit number — all digits unique!
        </p>
        {gameDate && (
          <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "0.82rem" }}>
            {new Date(gameDate + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Name entry */}
      {phase === "name_entry" && (
        <div style={{ ...cardStyle, position: "relative", zIndex: 1 }}>
          <h2 style={{ margin: "0 0 0.5rem", fontWeight: 700, fontSize: "1.1rem", color: "#a78bfa" }}>
            Enter your name to begin
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.88rem", margin: "0 0 1.2rem" }}>
            Your name will appear on the leaderboard if you complete today's challenge.
          </p>
          <form onSubmit={handleStart} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your name"
              autoFocus
              maxLength={24}
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10,
                padding: "0.75rem 1rem",
                color: "#f1f5f9",
                fontSize: "1rem",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
            {error && (
              <div style={{ color: "#ef4444", fontSize: "0.88rem" }}>{error}</div>
            )}
            <button type="submit" style={btnStyle} disabled={isLoading || !playerName.trim()}>
              {isLoading ? "Starting…" : "Start Challenge"}
            </button>
          </form>
        </div>
      )}

      {/* Playing */}
      {phase === "playing" && (
        <div style={{ ...cardStyle, position: "relative", zIndex: 1 }}>
          {/* Stats bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <span style={{ color: "#94a3b8", fontSize: "0.88rem" }}>
              Guesses: <strong style={{ color: "#f1f5f9" }}>{guesses.length}</strong>
            </span>
            <span
              style={{
                background: "rgba(245,158,11,0.15)",
                border: "1px solid rgba(245,158,11,0.3)",
                borderRadius: 8,
                padding: "3px 10px",
                color: "#fbbf24",
                fontWeight: 700,
                fontSize: "0.95rem",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              ⏱ {formatTime(elapsed)}
            </span>
          </div>

          {/* Guess history */}
          <GuessFeedback guesses={guesses} />

          {/* Legend */}
          {guesses.length === 0 && (
            <div
              style={{
                display: "flex",
                gap: 16,
                justifyContent: "center",
                marginBottom: 16,
                fontSize: "0.8rem",
                color: "#64748b",
              }}
            >
              <span><span style={{ color: "#10b981" }}>●</span> Right position</span>
              <span><span style={{ color: "#f59e0b" }}>●</span> Wrong position</span>
              <span><span style={{ color: "#334155" }}>●</span> Not in number</span>
            </div>
          )}

          {/* PIN input */}
          <form onSubmit={handleGuess}>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 12 }}>
              {[0, 1, 2, 3].map((i) => (
                <input
                  key={i}
                  ref={inputRefs[i]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={pinDigits[i]}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(i, e)}
                  style={{
                    width: 52,
                    height: 56,
                    textAlign: "center",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    background: "rgba(255,255,255,0.08)",
                    border: `1px solid ${pinDigits[i] ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.12)"}`,
                    borderRadius: 10,
                    color: "#f1f5f9",
                    outline: "none",
                    caretColor: "transparent",
                  }}
                />
              ))}
            </div>
            {error && (
              <div style={{ color: "#ef4444", fontSize: "0.85rem", textAlign: "center", marginBottom: 8 }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              style={{
                ...btnStyle,
                opacity: isLoading || pinDigits.join("").length !== 4 ? 0.5 : 1,
                cursor: isLoading || pinDigits.join("").length !== 4 ? "not-allowed" : "pointer",
              }}
              disabled={isLoading || pinDigits.join("").length !== 4}
            >
              {isLoading ? "Checking…" : "Submit Guess"}
            </button>
          </form>
        </div>
      )}

      {/* Finished */}
      {phase === "finished" && (
        <div
          style={{
            ...cardStyle,
            textAlign: "center",
            position: "relative",
            zIndex: 1,
            border: "1px solid rgba(245,158,11,0.3)",
            boxShadow:
              "0 8px 40px rgba(245,158,11,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: 8 }}>🎉</div>
          <h2
            style={{
              margin: "0 0 0.25rem",
              fontWeight: 800,
              fontSize: "1.6rem",
              background: "linear-gradient(135deg, #fbbf24 0%, #f97316 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            You cracked it!
          </h2>
          <p style={{ color: "#94a3b8", margin: "0 0 1.5rem" }}>
            Great job, <strong style={{ color: "#f1f5f9" }}>{playerName}</strong>!
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 24,
              marginBottom: 20,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#a78bfa" }}>
                {guesses.length}
              </div>
              <div style={{ color: "#64748b", fontSize: "0.8rem" }}>Guesses</div>
            </div>
            <div
              style={{
                width: 1,
                background: "rgba(255,255,255,0.08)",
              }}
            />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#fbbf24" }}>
                {formatTime(timeTaken ?? elapsed)}
              </div>
              <div style={{ color: "#64748b", fontSize: "0.8rem" }}>Time</div>
            </div>
          </div>

          <GuessFeedback guesses={guesses} />

          <div style={{ display: "flex", gap: 10, marginTop: 8, flexDirection: "column" }}>
            <button
              onClick={() => navigate("/leaderboard")}
              style={{ ...btnStyle, marginTop: 0 }}
            >
              🏆 View Leaderboard
            </button>
            <button onClick={() => navigate("/")} style={{ ...ghostBtnStyle, width: "100%", marginTop: 4 }}>
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
