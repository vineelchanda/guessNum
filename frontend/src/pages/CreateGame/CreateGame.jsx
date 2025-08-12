import React, { useState } from "react";

function CreateGamePage({ send, loading, error }) {
  const [playerName, setPlayerName] = useState("");
  const [fourDigit, setFourDigit] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const isUniqueDigits = (num) => {
    return new Set(num).size === num.length;
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (fourDigit.length !== 4 || !isUniqueDigits(fourDigit)) {
      setInfoMsg("Each digit must be unique and 4 digits required.");
      return;
    }
    setInfoMsg("");
    send({
      type: "CREATE_GAME",
      playerInfo: { name: playerName, fourDigit },
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #fffbe7 0%, #ffe066 100%)",
        padding: 0,
        fontFamily: "Segoe UI, Roboto, Arial, sans-serif",
      }}
    >
      {/* Responsive styles for CreateGame page */}
      <style>{`
        @media (max-width: 600px) {
          .create-game-card {
            min-width: 0 !important;
            max-width: 98vw !important;
            padding: 18px 4vw 18px 4vw !important;
          }
          .create-game-card h2 {
            font-size: 22px !important;
          }
          .create-game-card input {
            font-size: 15px !important;
            padding: 8px 8px !important;
          }
          .create-game-card button {
            font-size: 15px !important;
            padding: 8px 0 !important;
          }
        }
      `}</style>
      <div
        className="create-game-card"
        style={{
          background: "linear-gradient(135deg, #f8fafc 60%, #e0eafc 100%)",
          borderRadius: 20,
          boxShadow: "0 6px 32px #b0c4de33, 0 1.5px 8px #1976d211",
          padding: "40px 30px 32px 30px",
          minWidth: 340,
          maxWidth: 420,
          width: "100%",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative dots pattern */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 18,
            background:
              "repeating-linear-gradient(90deg, #cfdef3 0 2px, transparent 2px 16px)",
            opacity: 0.25,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 18,
            background:
              "repeating-linear-gradient(90deg, #cfdef3 0 2px, transparent 2px 16px)",
            opacity: 0.18,
          }}
        />
        <h2
          style={{
            fontWeight: 800,
            fontSize: 28,
            marginBottom: 8,
            color: "#43a047",
            letterSpacing: 1,
          }}
        >
          Create a New Game
        </h2>
        <div style={{ color: "#555", marginBottom: 18, fontSize: 16 }}>
          Ready to challenge your friends? <br />
          Enter your name and a secret 4-digit number to start a new game.
          <br />
          <span style={{ color: "#bfa100", fontWeight: 600 }}>
            All digits must be unique!
          </span>
          <br />
          <span style={{ color: "#1976d2", fontWeight: 500 }}>
            Share the Game ID with your friend after creating the game!
          </span>
        </div>
        <form
          onSubmit={handleCreate}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
          autoComplete="off"
        >
          <input
            type="text"
            placeholder="Your Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            required
            style={{
              padding: "10px 12px",
              borderRadius: 6,
              border: "1.5px solid #43a047",
              fontSize: 17,
              marginBottom: 2,
              outline: "none",
              fontWeight: 500,
              background: "#f7fff7",
              transition: "border 0.2s",
            }}
          />
          <input
            type="text"
            placeholder="4-digit Number (unique digits)"
            value={fourDigit}
            onChange={(e) => {
              let val = e.target.value.replace(/[^\d]/g, "");
              // Remove repeated digits as user types
              let unique = "";
              for (let ch of val) {
                if (!unique.includes(ch) && unique.length < 4) unique += ch;
              }
              setFourDigit(unique);
              if (unique.length < 4) {
                setInfoMsg("");
              } else if (!isUniqueDigits(unique)) {
                setInfoMsg("Each digit must be unique.");
              } else {
                setInfoMsg("");
              }
            }}
            maxLength={4}
            required
            style={{
              padding: "10px 12px",
              borderRadius: 6,
              border: "1.5px solid #bfa100",
              fontSize: 17,
              marginBottom: 2,
              outline: "none",
              fontWeight: 600,
              background: "#fffbe7",
              letterSpacing: 4,
              textAlign: "center",
              transition: "border 0.2s",
            }}
          />
          {infoMsg && (
            <div
              style={{
                color: "#bfa100",
                fontWeight: 600,
                fontSize: 15,
                marginTop: -8,
              }}
            >
              {infoMsg}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              fontSize: 18,
              padding: "10px 0",
              borderRadius: 6,
              background: loading
                ? "linear-gradient(90deg, #f3e7b3 0%, #ffe066 100%)"
                : "linear-gradient(90deg, #ffd200 0%, #f7971e 100%)",
              color: loading ? "#888" : "#222",
              border: "none",
              fontWeight: 700,
              marginTop: 8,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px #ffd20055",
              transition: "background 0.2s",
              letterSpacing: "0.5px",
            }}
          >
            {loading ? "Creating..." : "Create Game"}
          </button>
        </form>
        {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}
        <button
          onClick={() => send({ type: "GO_TO_HOME" })}
          style={{
            fontSize: 15,
            padding: "7px 0",
            borderRadius: 6,
            background: "linear-gradient(90deg, #ffd200 0%, #f7971e 100%)",
            color: "#222",
            border: "none",
            fontWeight: 600,
            marginTop: 18,
            width: "100%",
            cursor: "pointer",
            boxShadow: "0 2px 8px #ffd20055",
            transition: "background 0.2s",
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

export default CreateGamePage;
