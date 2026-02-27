import React, { useState, useEffect } from "react";
import { listenToGame } from "../../utils";
import ScratchPad from "./ScratchPad";

function GamePage({ send, state }) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const pinRefs = [
    React.useRef(),
    React.useRef(),
    React.useRef(),
    React.useRef(),
  ];
  const { gameId, playerRole, isMyTurn, gameData } = state.context;
  // Timer state
  const [timeLeft, setTimeLeft] = useState(0);
  
  const isSystemGame = gameData?.isSystemGame || false;

  useEffect(() => {
    const unsubscribe = listenToGame(gameId, (data) => {
      console.log(data, "Game data updated");
      // Trigger your XState event or any other logic
      send({ type: "GAME_DATA_CHANGED", data });
    });
    return () => unsubscribe();
  }, [gameId, send]);

  // Timer effect (15 minutes from expireAt)
  useEffect(() => {
    if (!gameData?.expireAt) return;
    // expireAt from backend is likely a Firestore timestamp or ISO string
    let expireTime = gameData.expireAt;
    if (expireTime && expireTime.seconds) {
      expireTime = expireTime.seconds * 1000;
    } else if (typeof expireTime === "string") {
      expireTime = new Date(expireTime).getTime();
    }
    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expireTime - now) / 1000));
      setTimeLeft(diff);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [gameData?.expireAt]);

  const handlePinChange = (idx, val) => {
    if (!/^[0-9]?$/.test(val)) return; // Only allow single digit
    const newPin = [...pin];
    newPin[idx] = val;
    setPin(newPin);
    if (val && idx < 3) {
      pinRefs[idx + 1].current?.focus();
    }
    if (!val && idx > 0) {
      pinRefs[idx - 1].current?.focus();
    }
  };

  const handlePinKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !pin[idx] && idx > 0) {
      pinRefs[idx - 1].current?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) {
      pinRefs[idx - 1].current?.focus();
    }
    if (e.key === "ArrowRight" && idx < 3) {
      pinRefs[idx + 1].current?.focus();
    }
  };

  const handleGuess = (e) => {
    e.preventDefault();
    const pinValue = pin.join("");
    if (pinValue.length !== 4) return;
    send({
      type: "MAKE_GUESS",
      guess: pinValue,
      player: playerRole,
    });
    setPin(["", "", "", ""]);
    pinRefs[0].current?.focus();
  };

  // Determine player names and turn info from gameData
  const player1Name = gameData?.player1?.name || "Player 1";
  const player2Name = isSystemGame ? "System" : (gameData?.player2?.name || "Player 2");
  const turn = gameData?.turn;

  // Guess history
  const player1Turns = gameData?.player1Turns || [];
  const player2Turns = gameData?.player2Turns || [];

  // Helper to render guess (no color logic)
  function renderGuess(guess) {
    if (!guess) return null;
    return guess
      .toString()
      .split("")
      .map((digit, idx) => (
        <span
          key={idx}
          style={{
            border: "1px solid #ccc",
            borderRadius: 4,
            padding: "2px 6px",
            margin: 1,
            fontWeight: 600,
          }}
        >
          {digit}
        </span>
      ));
  }

  // Get selected numbers
  const myNumber =
    playerRole === "player1"
      ? gameData?.player1?.number
      : gameData?.player2?.number;
  // const opponentNumber =
  //   playerRole === "player1"
  //     ? gameData?.player2FourDigit
  //     : gameData?.player1FourDigit;
  const opponentName = playerRole === "player1" ? player2Name : player1Name;
  const myName = playerRole === "player1" ? player1Name : player2Name;

  // Timer display
  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  // Winner logic
  const isFinished =
    gameData?.gameStatus === "finished" || gameData?.gamePhase === "finished";
  let winnerName = null;
  let winnerRole = null;
  if (isFinished) {
    if (gameData?.winner) {
      winnerName = gameData.winner;
      // Try to infer winnerRole
      if (gameData.winner === player1Name) winnerRole = "player1";
      else if (gameData.winner === player2Name) winnerRole = "player2";
    } else {
      const lastP1 = player1Turns[player1Turns.length - 1];
      const lastP2 = player2Turns[player2Turns.length - 1];
      if (
        lastP1 &&
        lastP1.correct_digits === 4 &&
        lastP1.correct_positions === 4
      ) {
        winnerName = player1Name;
        winnerRole = "player1";
      } else if (
        lastP2 &&
        lastP2.correct_digits === 4 &&
        lastP2.correct_positions === 4
      ) {
        winnerName = player2Name;
        winnerRole = "player2";
      }
    }
  }

  // Player color assignments: player1 = blue, player2 = green
  const playerColors = {
    player1: {
      border: "#1976d2",
      bg: "#f0f7ff",
      text: "#1565c0",
      pageBg: "#dbeafe",
    },
    player2: {
      border: "#4caf50",
      bg: "#f7fff7",
      text: "#2e7d32",
      pageBg: "#dcfce7",
    },
  };

  const myColor = playerColors[playerRole] || playerColors.player1;
  const opponentRole = playerRole === "player1" ? "player2" : "player1";
  const opponentColor = isSystemGame
    ? { border: "#ff9800", bg: "#fff3e0", text: "#e65100", pageBg: "#fff3e0" }
    : playerColors[opponentRole];

  // Background changes to the active player's color
  const activeBg =
    turn === "player1"
      ? playerColors.player1.pageBg
      : turn === "player2"
      ? isSystemGame
        ? "#fff3e0"
        : playerColors.player2.pageBg
      : "#f5f5f5";

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        backgroundColor: activeBg,
        transition: "background-color 0.6s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "20px 20px",
        boxSizing: "border-box",
      }}
    >
      {/* Game ID display and copy */}
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          boxShadow: "0 2px 8px #0001",
          padding: "10px 18px",
          // marginBottom: 18,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontWeight: 600,
          fontSize: 18,
          maxWidth: 340,
          width: "100%",
          justifyContent: "center",
        }}
      >
        Game ID:
        <span
          style={{
            fontFamily: "monospace",
            fontWeight: 700,
            fontSize: 18,
            background: "#f3f3f3",
            padding: "2px 8px",
            borderRadius: 4,
          }}
        >
          {gameId || "-"}
        </span>
        <button
          style={{
            marginLeft: 8,
            padding: "2px 10px",
            borderRadius: 4,
            border: "none",
            background: "#e0eafc",
            cursor: "pointer",
            fontWeight: 500,
          }}
          onClick={() => {
            if (gameId) {
              navigator.clipboard.writeText(gameId);
            }
          }}
        >
          Copy
        </button>
      </div>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <ScratchPad />
      </div>
      {/* Waiting for player2 message */}
      {gameData?.gameStatus === "waiting_for_player2" && !isSystemGame && (
        <div
          style={{
            background: "#fffbe7",
            color: "#bfa100",
            border: "1px solid #ffe066",
            borderRadius: 8,
            padding: "12px 20px",
            marginBottom: 18,
            fontWeight: 600,
            fontSize: 18,
            textAlign: "center",
            maxWidth: 400,
          }}
        >
          Waiting for the other player to join...
        </div>
      )}
      {/* Responsive styles for Game page */}
      <style>{`
        @media (max-width: 900px) {
          .game-flex-row {
            flex-direction: column !important;
            gap: 18px !important;
            align-items: stretch !important;
            max-width: 98vw !important;
          }
          .game-panel {
            min-width: 0 !important;
            width: 100% !important;
            margin-bottom: 12px !important;
          }
        }
        @media (max-width: 600px) {
          .game-flex-row {
            padding: 0 2vw !important;
            gap: 10px !important;
          }
          .game-panel {
            padding: 10px 4px !important;
            font-size: 0.97rem !important;
          }
          .game-center {
            padding: 10px 2px !important;
          }
        }
      `}</style>
      {/* Winner/loser message at the top */}
      {isFinished && (
        <div
          style={{
            width: "100%",
            maxWidth: 900,
            margin: "0 auto 32px auto",
            background:
              winnerRole === playerRole
                ? "linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)"
                : "linear-gradient(90deg, #e57373 0%, #ffb199 100%)",
            color: winnerRole === playerRole ? "#222" : "#fff",
            borderRadius: 14,
            padding: "32px 16px",
            textAlign: "center",
            boxShadow: "0 4px 24px rgba(60,200,180,0.10)",
            fontWeight: 700,
          }}
        >
          <h1 style={{ fontSize: 32, marginBottom: 8 }}>
            {winnerRole === playerRole
              ? "🎉 Congratulations! You won the game!"
              : winnerRole
              ? `Better luck next time! ${winnerName} has won the game.`
              : "Game Over!"}
          </h1>
          <button
            onClick={() => send({ type: "GO_TO_HOME" })}
            style={{
              fontSize: 18,
              padding: "8px 24px",
              borderRadius: 8,
              background: winnerRole === playerRole ? "#388e3c" : "#e57373",
              color: "white",
              border: "none",
              marginTop: 12,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Exit to Home
          </button>
        </div>
      )}
      <div
        className="game-flex-row"
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 32,
          alignItems: "flex-start",
          justifyContent: "center",
          width: "100%",
          maxWidth: 1200,
        }}
      >
        {/* Left: Current Player */}
        <div
          className="game-panel"
          style={{
            flex: 1,
            border: `2px solid ${myColor.border}`,
            borderRadius: 8,
            padding: 16,
            background: myColor.bg,
            minWidth: 280,
          }}
        >
          <h3 style={{ color: myColor.text }}>{myName} (You)</h3>
          <div style={{ marginBottom: 12 }}>
            <strong>Your Selected Number:</strong>
            <div style={{ fontSize: 22, letterSpacing: 4, marginTop: 4 }}>
              {myNumber || <span style={{ color: "#aaa" }}>-</span>}
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Your Guesses:</strong>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {(playerRole === "player1" ? player1Turns : player2Turns)
                .length === 0 && <li>No guesses yet.</li>}
              {(playerRole === "player1" ? player1Turns : player2Turns).map(
                (turn, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>
                    {renderGuess(turn.guess)}
                    <span
                      style={{ marginLeft: 8, fontSize: 12, color: "#888" }}
                    >
                      (Correct digits: {turn.correct_digits}, Correct positions:{" "}
                      {turn.correct_positions})
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        {/* Center: Game Info */}
        <div
          className="game-center"
          style={{ flex: 0.5, minWidth: 180, textAlign: "center", padding: 16 }}
        >
          <h2>{isSystemGame ? "System AI Opponent" : "Game In Progress"}</h2>
          <div
            style={{ marginBottom: 16, position: "relative", minHeight: 40 }}
          >
            <strong>Current Turn: </strong>
            {turn === "player1"
              ? `${player1Name} (Player 1)`
              : turn === "player2"
              ? `${player2Name}${isSystemGame ? " (AI)" : " (Player 2)"}`
              : "-"}
            {isMyTurn && (
              <span
                style={{
                  display: "inline-block",
                  background:
                    "linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)",
                  color: "#222",
                  fontWeight: 700,
                  fontSize: 20,
                  borderRadius: 8,
                  padding: "6px 18px",
                  marginLeft: 16,
                  boxShadow: "0 2px 8px rgba(60,200,180,0.15)",
                  border: "2px solid #38f9d7",
                  letterSpacing: 1,
                  animation: "pulse 1.2s infinite",
                }}
              >
                Your Turn!
              </span>
            )}
            {!isMyTurn && turn === "player2" && isSystemGame && (
              <span
                style={{
                  display: "inline-block",
                  background:
                    "linear-gradient(90deg, #ff9800 0%, #f57c00 100%)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 16,
                  borderRadius: 8,
                  padding: "4px 12px",
                  marginLeft: 16,
                  boxShadow: "0 2px 8px rgba(255,152,0,0.15)",
                  border: "2px solid #f57c00",
                  letterSpacing: 1,
                  animation: "pulse 1.5s infinite",
                }}
              >
                🤖 AI Thinking...
              </span>
            )}
          </div>
          {/* Add keyframes for pulse animation */}
          <style>{`
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(60,200,180,0.25); }
            70% { box-shadow: 0 0 0 12px rgba(60,200,180,0.05); }
            100% { box-shadow: 0 0 0 0 rgba(60,200,180,0.25); }
          }
        `}</style>
          <div style={{ marginBottom: 16 }}>
            <strong>Game Timer: </strong>
            <span
              style={{
                fontSize: 18,
                color: timeLeft < 60 ? "red" : "#333",
                fontWeight: 600,
                marginLeft: 8,
              }}
            >
              {formatTime(timeLeft)}
            </span>
          </div>
          <form
            onSubmit={handleGuess}
            style={{
              marginBottom: 16,
              marginTop: 18,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
            autoComplete="off"
          >
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              {pin.map((digit, idx) => (
                <input
                  key={idx}
                  ref={pinRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(idx, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(idx, e)}
                  disabled={!isMyTurn}
                  style={{
                    width: 36,
                    height: 44,
                    fontSize: 28,
                    textAlign: "center",
                    border: "1px solid #aaa",
                    borderRadius: 6,
                    background: isMyTurn ? "#fff" : "#f3f3f3",
                    outline: "none",
                    fontWeight: 600,
                    letterSpacing: 2,
                    transition: "border 0.2s",
                  }}
                  autoComplete="off"
                  name={`pin-${idx}`}
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={!isMyTurn || pin.join("").length !== 4}
              style={{
                fontSize: 16,
                padding: "8px 16px",
                borderRadius: 4,
                background:
                  isMyTurn && pin.join("").length === 4 ? "#4caf50" : "#ccc",
                color: "white",
                border: "none",
                fontWeight: 600,
                cursor:
                  isMyTurn && pin.join("").length === 4
                    ? "pointer"
                    : "not-allowed",
                transition: "background 0.2s",
              }}
            >
              Submit Guess
            </button>
          </form>
          <button
            onClick={() => send({ type: "GO_TO_HOME" })}
            style={{
              fontSize: 14,
              padding: "4px 10px",
              borderRadius: 4,
              background: "#e57373",
              color: "white",
              border: "none",
            }}
          >
            Exit to Home
          </button>
        </div>

        {/* Right: Opponent */}
        <div
          className="game-panel"
          style={{
            flex: 1,
            border: `2px solid ${opponentColor.border}`,
            borderRadius: 8,
            padding: 16,
            background: opponentColor.bg,
            minWidth: 280,
          }}
        >
          <h3 style={{ color: opponentColor.text }}>
            {opponentName} {isSystemGame ? "🤖" : ""}
          </h3>
          {/* Opponent's number should not be shown for privacy */}
          <div style={{ marginBottom: 12 }}>
            <strong>Opponent's Number:</strong>
            <div style={{ fontSize: 22, letterSpacing: 4, marginTop: 4 }}>
              <span style={{ color: "#aaa" }}>Hidden</span>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>{opponentName}'s Guesses:</strong>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {(playerRole === "player1" ? player2Turns : player1Turns)
                .length === 0 && <li>No guesses yet.</li>}
              {(playerRole === "player1" ? player2Turns : player1Turns).map(
                (turn, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>
                    {renderGuess(turn.guess)}
                    <span
                      style={{ marginLeft: 8, fontSize: 12, color: "#888" }}
                    >
                      (Correct digits: {turn.correct_digits}, Correct positions:{" "}
                      {turn.correct_positions})
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GamePage;
