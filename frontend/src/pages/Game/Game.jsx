import React, { useState, useEffect } from "react";
import { listenToGame } from "../../utils";

function GamePage({ send, state }) {
  const [guess, setGuess] = useState("");
  const { gameId, playerRole, isMyTurn, gameData, playerInfo } = state.context;
  // Timer state
  const [timeLeft, setTimeLeft] = useState(0);

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

  const handleGuess = (e) => {
    e.preventDefault();
    // Send MAKE_GUESS event to state machine
    send({
      type: "MAKE_GUESS",
      guess,
      player: playerRole,
    });
    setGuess("");
  };

  // Determine player names and turn info from gameData
  const player1Name = gameData?.player1?.name || "Player 1";
  const player2Name = gameData?.player2?.name || "Player 2";
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
      ? gameData?.player1.number
      : gameData?.player2.number;
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

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "40px 0",
        boxSizing: "border-box",
      }}
    >
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
          style={{
            flex: 1,
            border: "2px solid #4caf50",
            borderRadius: 8,
            padding: 16,
            background: "#f7fff7",
            minWidth: 280,
          }}
        >
          <h3 style={{ color: "#388e3c" }}>{myName} (You)</h3>
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
          style={{ flex: 0.5, minWidth: 180, textAlign: "center", padding: 16 }}
        >
          <h2>Game In Progress</h2>
          <div
            style={{ marginBottom: 16, position: "relative", minHeight: 40 }}
          >
            <strong>Current Turn: </strong>
            {turn === "player1"
              ? `${player1Name} (Player 1)`
              : turn === "player2"
              ? `${player2Name} (Player 2)`
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
          <form onSubmit={handleGuess} style={{ marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Enter 4-digit guess"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              maxLength={4}
              required
              disabled={!isMyTurn}
              style={{
                fontSize: 18,
                padding: "4px 8px",
                borderRadius: 4,
                border: "1px solid #aaa",
                marginRight: 8,
              }}
            />
            <button
              type="submit"
              disabled={!isMyTurn}
              style={{
                fontSize: 16,
                padding: "4px 12px",
                borderRadius: 4,
                background: isMyTurn ? "#4caf50" : "#ccc",
                color: "white",
                border: "none",
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
          style={{
            flex: 1,
            border: "2px solid #1976d2",
            borderRadius: 8,
            padding: 16,
            background: "#f0f7ff",
            minWidth: 280,
          }}
        >
          <h3 style={{ color: "#1976d2" }}>{opponentName}</h3>
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
