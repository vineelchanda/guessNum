import React, { useState } from "react";

function CreateGamePage({ send, loading, error }) {
  const [playerName, setPlayerName] = useState("");
  const [fourDigit, setFourDigit] = useState("");

  const handleCreate = (e) => {
    e.preventDefault();
    console.log(playerName, fourDigit);
    send({
      type: "CREATE_GAME",
      playerInfo: { name: playerName, fourDigit },
    });
  };

  return (
    <div>
      <h2>Create Game</h2>
      <form onSubmit={handleCreate}>
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
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create"}
        </button>
      </form>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <button onClick={() => send({ type: "GO_TO_HOME" })}>Back</button>
    </div>
  );
}

export default CreateGamePage;
