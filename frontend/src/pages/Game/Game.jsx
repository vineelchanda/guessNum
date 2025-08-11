import React, { useState, useEffect } from "react";
import { listenToGame } from "../../utils";

function GamePage({ send, state }) {
  const [guess, setGuess] = useState("");
  const { gameId, playerRole, isMyTurn, gameData, playerInfo } = state.context;

  useEffect(() => {
    const unsubscribe = listenToGame(gameId, (data) => {
      console.log(data, "Game data updated");
      // Trigger your XState event or any other logic
      send({ type: "GAME_DATA_CHANGED", data });
      // switch (data.gamePhase) {
      //   case "player1Guessing":
      //     // send({ type: "PLAYER1_TURN" });
      //     break;
      //   case "player2Guessing":
      //     // send({ type: "PLAYER2_TURN" });
      //     break;
      //   case "player2Validating":
      //     send({ type: "PLAYER2_VALIDATING" });
      //     break;
      //   case "player1Validating":
      //     send({ type: "PLAYER1_VALIDATING" });
      //     break;
      //   case "finished":
      //     send({ type: "GAME_FINISHED", winner: data.winner });
      //     break;
      //   default:
      //     break;
      // }
    });
    return () => unsubscribe();
  }, [gameId, send]);

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

  // Helper to render guess with highlights
  function renderGuess(guess, correct_positions, correct_digits) {
    if (!guess) return null;
    const guessArr = guess.toString().split("");
    // Mark correct positions in green, correct digits (but wrong position) in yellow
    // For this, we need to know which digits are correct but not in the right position
    // We'll use a similar logic as the backend
    const answerArr = guessArr.slice(); // dummy, since we don't know the answer, but we have correct_positions/correct_digits
    let greenCount = correct_positions;
    let yellowCount = correct_digits - correct_positions;
    // Mark left to right: first green, then yellow, then normal
    return guessArr.map((digit, idx) => {
      let style = {};
      if (greenCount > 0) {
        style = {
          backgroundColor: "#4caf50",
          color: "white",
          borderRadius: 4,
          padding: "2px 6px",
          margin: 1,
        };
        greenCount--;
      } else if (yellowCount > 0) {
        style = {
          backgroundColor: "#ffeb3b",
          color: "#333",
          borderRadius: 4,
          padding: "2px 6px",
          margin: 1,
        };
        yellowCount--;
      }
      return (
        <span key={idx} style={style}>
          {digit}
        </span>
      );
    });
  }

  return (
    <div>
      <h2>Game In Progress</h2>
      <div style={{ marginBottom: 16 }}>
        <strong>You are: </strong>
        {playerRole
          ? playerRole === "player1"
            ? `${player1Name} (Player 1)`
            : `${player2Name} (Player 2)`
          : "Unknown"}
      </div>
      <div style={{ marginBottom: 16 }}>
        <strong>Current Turn: </strong>
        {turn === "player1"
          ? `${player1Name} (Player 1)`
          : turn === "player2"
          ? `${player2Name} (Player 2)`
          : "-"}
        {isMyTurn && (
          <span style={{ color: "green", marginLeft: 8 }}>(Your turn!)</span>
        )}
      </div>

      {/* Player 1 Guess History */}
      <div style={{ marginBottom: 16 }}>
        <strong>{player1Name} Guesses:</strong>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {player1Turns.length === 0 && <li>No guesses yet.</li>}
          {player1Turns.map((turn, idx) => (
            <li key={idx} style={{ marginBottom: 4 }}>
              {renderGuess(
                turn.guess,
                turn.correct_positions,
                turn.correct_digits
              )}
              <span style={{ marginLeft: 8, fontSize: 12, color: "#888" }}>
                (Correct digits: {turn.correct_digits}, Correct positions:{" "}
                {turn.correct_positions})
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Player 2 Guess History */}
      <div style={{ marginBottom: 16 }}>
        <strong>{player2Name} Guesses:</strong>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {player2Turns.length === 0 && <li>No guesses yet.</li>}
          {player2Turns.map((turn, idx) => (
            <li key={idx} style={{ marginBottom: 4 }}>
              {renderGuess(
                turn.guess,
                turn.correct_positions,
                turn.correct_digits
              )}
              <span style={{ marginLeft: 8, fontSize: 12, color: "#888" }}>
                (Correct digits: {turn.correct_digits}, Correct positions:{" "}
                {turn.correct_positions})
              </span>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleGuess}>
        <input
          type="text"
          placeholder="Enter 4-digit guess"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          maxLength={4}
          required
          disabled={!isMyTurn}
        />
        <button type="submit" disabled={!isMyTurn}>
          Submit Guess
        </button>
      </form>
      <button onClick={() => send({ type: "GO_TO_HOME" })}>Exit to Home</button>
    </div>
  );
}

export default GamePage;
