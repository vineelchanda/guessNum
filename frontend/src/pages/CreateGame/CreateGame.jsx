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

const inputStyle = (accentColor = "#7c3aed") => ({
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: `1.5px solid rgba(255,255,255,0.12)`,
  fontSize: 16,
  outline: "none",
  fontWeight: 500,
  background: "rgba(255,255,255,0.06)",
  color: "#f1f5f9",
  transition: "border 0.2s, box-shadow 0.2s",
  boxSizing: "border-box",
});

const btnPrimary = (disabled) => ({
  width: "100%",
  fontSize: 17,
  padding: "12px 0",
  borderRadius: 10,
  background: disabled
    ? "rgba(255,255,255,0.08)"
    : "linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)",
  color: disabled ? "#64748b" : "#fff",
  border: "none",
  fontWeight: 700,
  marginTop: 8,
  cursor: disabled ? "not-allowed" : "pointer",
  boxShadow: disabled ? "none" : "0 4px 20px rgba(124, 58, 237, 0.35)",
  transition: "box-shadow 0.2s, transform 0.12s",
  letterSpacing: "0.4px",
});

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

function CreateGamePage({ send, loading, error, state }) {
  const [playerName, setPlayerName] = useState("");
  const [fourDigit, setFourDigit] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const isSystemGame = state?.context?.isSystemGame || false;

  const isUniqueDigits = (num) => new Set(num).size === num.length;

  const handleCreate = (e) => {
    e.preventDefault();
    if (fourDigit.length !== 4 || !isUniqueDigits(fourDigit)) {
      setInfoMsg("Each digit must be unique and 4 digits required.");
      return;
    }
    setInfoMsg("");
    send({ type: "CREATE_GAME", playerInfo: { name: playerName, fourDigit } });
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
        position: "fixed", top: "-15%", left: "-10%", width: "55%", height: "55%",
        background: "radial-gradient(circle, rgba(124,58,237,0.16) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: "-10%", right: "-10%", width: "45%", height: "45%",
        background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Responsive override */}
      <style>{`
        @media (max-width: 600px) {
          .create-game-card {
            min-width: 0 !important;
            max-width: 97vw !important;
            padding: 24px 16px 20px 16px !important;
          }
        }
        .create-game-input:focus {
          border-color: rgba(124,58,237,0.7) !important;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.15) !important;
        }
        .create-game-input::placeholder { color: #4b5563; }
        .btn-primary-glow:hover:not(:disabled) {
          box-shadow: 0 0 32px rgba(124,58,237,0.55), 0 0 64px rgba(6,182,212,0.2) !important;
          transform: translateY(-1px);
        }
        .btn-secondary-ghost:hover {
          background: rgba(255,255,255,0.1) !important;
          color: #f1f5f9 !important;
        }
      `}</style>

      <div className="create-game-card" style={{ ...glassCard, zIndex: 1 }}>
        {/* Top accent bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: "linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)",
          borderRadius: "20px 20px 0 0",
        }} />

        <h2 style={{ fontWeight: 800, fontSize: 26, marginBottom: 8, color: "#a78bfa", letterSpacing: 0.5 }}>
          {isSystemGame ? "⚔️ Play vs System" : "🎮 Create a New Game"}
        </h2>
        <div style={{ color: "#64748b", marginBottom: 24, fontSize: 14.5, lineHeight: 1.65 }}>
          {isSystemGame ? (
            <>
              Challenge the AI to a guessing duel!<br />
              Enter your name and a secret 4-digit number.<br />
              <span style={{ color: "#f59e0b", fontWeight: 600 }}>All digits must be unique!</span><br />
              <span style={{ color: "#06b6d4", fontWeight: 500 }}>The system will auto-join and play!</span>
            </>
          ) : (
            <>
              Ready to challenge your friends?<br />
              Enter your name and a secret 4-digit number.<br />
              <span style={{ color: "#f59e0b", fontWeight: 600 }}>All digits must be unique!</span><br />
              <span style={{ color: "#06b6d4", fontWeight: 500 }}>Share the Game ID after creating!</span>
            </>
          )}
        </div>

        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 14 }} autoComplete="off">
          <input
            className="create-game-input"
            type="text"
            placeholder="Your Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            required
            style={inputStyle()}
          />
          <input
            className="create-game-input"
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
            style={{ ...inputStyle(), letterSpacing: 8, textAlign: "center", fontSize: 20, fontWeight: 700 }}
          />
          {infoMsg && (
            <div style={{ color: "#f59e0b", fontWeight: 600, fontSize: 13.5, marginTop: -6, textAlign: "left" }}>
              ⚠️ {infoMsg}
            </div>
          )}
          <button
            className="btn-primary-glow"
            type="submit"
            disabled={loading}
            style={btnPrimary(loading)}
          >
            {loading ? "Creating..." : isSystemGame ? "Start vs System" : "Create Game"}
          </button>
        </form>

        {error && (
          <div style={{ color: "#ef4444", marginTop: 12, fontSize: 14, fontWeight: 500 }}>
            ❌ {error}
          </div>
        )}

        <button
          className="btn-secondary-ghost"
          onClick={() => send({ type: "GO_TO_HOME" })}
          style={btnSecondary}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

export default CreateGamePage;
