import React, { useState } from "react";

const glassCard = {
  background: "rgba(255, 255, 255, 0.05)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: 20,
  boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
  padding: "40px 32px 32px 32px",
  minWidth: 340,
  maxWidth: 420,
  width: "100%",
  textAlign: "center",
  position: "relative",
  overflow: "hidden",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1.5px solid rgba(255,255,255,0.12)",
  fontSize: 16,
  outline: "none",
  fontWeight: 500,
  background: "rgba(255,255,255,0.06)",
  color: "#f1f5f9",
  transition: "border 0.2s, box-shadow 0.2s",
  boxSizing: "border-box",
};

const btnPrimary = {
  width: "100%",
  fontSize: 17,
  padding: "12px 0",
  borderRadius: 10,
  background: "linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)",
  color: "#fff",
  border: "none",
  fontWeight: 700,
  marginTop: 8,
  cursor: "pointer",
  boxShadow: "0 4px 20px rgba(124, 58, 237, 0.35)",
  transition: "box-shadow 0.2s, transform 0.12s",
  letterSpacing: "0.4px",
};

const btnSecondary = {
  width: "100%",
  fontSize: 15,
  padding: "10px 0",
  borderRadius: 10,
  background: "rgba(255,255,255,0.06)",
  color: "#94a3b8",
  border: "1px solid rgba(255,255,255,0.1)",
  fontWeight: 600,
  marginTop: 14,
  cursor: "pointer",
  transition: "background 0.2s, color 0.2s",
};

function JoinGamePage({ send }) {
  const [gameId, setGameId] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("gameId") || "";
    }
    return "";
  });
  const [playerName, setPlayerName] = useState("");
  const [fourDigit, setFourDigit] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const isUniqueDigits = (num) => new Set(num).size === num.length;

  const handleJoin = (e) => {
    e.preventDefault();
    if (fourDigit.length !== 4 || !isUniqueDigits(fourDigit)) {
      setInfoMsg("Each digit must be unique and 4 digits required.");
      return;
    }
    setInfoMsg("");
    send({ type: "JOIN_GAME", gameId, playerInfo: { name: playerName, fourDigit } });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a1a",
        padding: "20px",
        fontFamily: "Inter, Segoe UI, system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient blobs */}
      <div style={{
        position: "fixed", top: "-15%", right: "-10%", width: "55%", height: "55%",
        background: "radial-gradient(circle, rgba(6,182,212,0.14) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: "-10%", left: "-10%", width: "45%", height: "45%",
        background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <style>{`
        @media (max-width: 600px) {
          .join-game-card {
            min-width: 0 !important;
            max-width: 97vw !important;
            padding: 24px 16px 20px 16px !important;
          }
        }
        .join-game-input:focus {
          border-color: rgba(6,182,212,0.7) !important;
          box-shadow: 0 0 0 3px rgba(6,182,212,0.15) !important;
        }
        .join-game-input::placeholder { color: #4b5563; }
        .btn-join-glow:hover {
          box-shadow: 0 0 32px rgba(6,182,212,0.5), 0 0 64px rgba(124,58,237,0.2) !important;
          transform: translateY(-1px);
        }
        .btn-join-secondary:hover {
          background: rgba(255,255,255,0.1) !important;
          color: #f1f5f9 !important;
        }
      `}</style>

      <div className="join-game-card" style={{ ...glassCard, zIndex: 1 }}>
        {/* Top accent bar — cyan leading */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: "linear-gradient(90deg, #06b6d4 0%, #7c3aed 100%)",
          borderRadius: "20px 20px 0 0",
        }} />

        <h2 style={{ fontWeight: 800, fontSize: 26, marginBottom: 8, color: "#67e8f9", letterSpacing: 0.5 }}>
          🔗 Join a Game
        </h2>
        <div style={{ color: "#64748b", marginBottom: 24, fontSize: 14.5, lineHeight: 1.65 }}>
          Enter the Game ID shared by your friend,<br />
          your name, and a secret 4-digit number.<br />
          <span style={{ color: "#f59e0b", fontWeight: 600 }}>All digits must be unique!</span>
        </div>

        <form onSubmit={handleJoin} style={{ display: "flex", flexDirection: "column", gap: 14 }} autoComplete="off">
          <input
            className="join-game-input"
            type="text"
            placeholder="Game ID"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            className="join-game-input"
            type="text"
            placeholder="Your Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            className="join-game-input"
            type="text"
            placeholder="4-digit Secret (unique digits)"
            value={fourDigit}
            onChange={(e) => {
              let val = e.target.value.replace(/[^\d]/g, "");
              let unique = "";
              for (let ch of val) {
                if (!unique.includes(ch) && unique.length < 4) unique += ch;
              }
              setFourDigit(unique);
              setInfoMsg(unique.length === 4 && !isUniqueDigits(unique) ? "Each digit must be unique." : "");
            }}
            maxLength={4}
            required
            style={{ ...inputStyle, letterSpacing: 8, textAlign: "center", fontSize: 20, fontWeight: 700 }}
          />
          {infoMsg && (
            <div style={{ color: "#f59e0b", fontWeight: 600, fontSize: 13.5, marginTop: -6, textAlign: "left" }}>
              ⚠️ {infoMsg}
            </div>
          )}
          <button
            className="btn-join-glow"
            type="submit"
            style={btnPrimary}
          >
            Join Game
          </button>
        </form>

        <button
          className="btn-join-secondary"
          onClick={() => send({ type: "GO_TO_HOME" })}
          style={btnSecondary}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

export default JoinGamePage;
