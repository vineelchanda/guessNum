import React, { useState } from "react";

function CreateGamePage({ send, loading, error }) {
  const [playerName, setPlayerName] = useState("");

  const handleCreate = (e) => {
    e.preventDefault();
    console.log(playerName);
    send({
      type: "CREATE_GAME",
      playerInfo: { name: playerName },
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
