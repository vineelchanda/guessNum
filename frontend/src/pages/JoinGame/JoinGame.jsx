import React, { useState } from "react";

function JoinGamePage({ send }) {
  const [gameId, setGameId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [fourDigit, setFourDigit] = useState("");

  const handleJoin = (e) => {
    e.preventDefault();
    send({
      type: "JOIN_GAME",
      gameId,
      playerInfo: { name: playerName, fourDigit },
    });
  };

  return (
    <div>
      <h2>Join Game</h2>
      <form onSubmit={handleJoin}>
        <input
          type="text"
          placeholder="Game ID"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Your Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="4-digit Number"
          value={fourDigit}
          onChange={(e) => {
            const val = e.target.value;
            if (/^\d{0,4}$/.test(val)) setFourDigit(val);
          }}
          maxLength={4}
          required
        />
        <button type="submit">Join</button>
      </form>
      <button onClick={() => send({ type: "GO_TO_HOME" })}>Back</button>
    </div>
  );
}

export default JoinGamePage;
