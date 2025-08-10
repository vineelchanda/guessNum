import React, { useState, useEffect } from "react";
import { listenToGame } from "../../utils";

function GamePage({ send, state }) {
  const [guess, setGuess] = useState("");
  const { gameId } = state.context;

  useEffect(() => {
    const unsubscribe = listenToGame(gameId, (data) => {
      // Trigger your XState event or any other logic
      send({ type: "GAME_DATA_CHANGED", data });
    });
    return () => unsubscribe();
  }, [gameId, send]);

  const handleGuess = (e) => {
    e.preventDefault();
    // Call backend API to make a guess here
    setGuess("");
  };

  return (
    <div>
      <h2>Game In Progress</h2>
      <form onSubmit={handleGuess}>
        <input
          type="text"
          placeholder="Enter 4-digit guess"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          maxLength={4}
          required
        />
        <button type="submit">Submit Guess</button>
      </form>
      <button onClick={() => send({ type: "GO_TO_HOME" })}>Exit to Home</button>
    </div>
  );
}

export default GamePage;
