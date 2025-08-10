import React from "react";

function HomePage({ send }) {
  return (
    <div>
      <h1>Welcome to GuessNum!</h1>
      <button onClick={() => send({ type: "GO_TO_CREATE" })}>
        Create Game
      </button>
      <button onClick={() => send({ type: "GO_TO_JOIN" })}>Join Game</button>
    </div>
  );
}

export default HomePage;
