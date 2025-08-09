import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home";
import CreateGamePage from "./pages/CreateGame";
import JoinGamePage from "./pages/JoinGame";
import GamePage from "./pages/Game";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreateGamePage />} />
        <Route path="/join" element={<JoinGamePage />} />
        <Route path="/game/:gameId" element={<GamePage />} />
      </Routes>
    </Router>
  );
}

export default App;