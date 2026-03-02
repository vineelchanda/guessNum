import React from "react";
import { useMachine } from "@xstate/react";
import { Routes, Route, useNavigate } from "react-router-dom";
import HomePage from "./pages/Home";
import CreateGamePage from "./pages/CreateGame";
import JoinGamePage from "./pages/JoinGame";
import GamePage from "./pages/Game";
import DailyChallenge from "./pages/DailyChallenge/DailyChallenge";
import Leaderboard from "./pages/Leaderboard/Leaderboard";
import gameMachine from "./machine";
import "./App.css";

const STANDALONE_PATHS = ["/daily", "/leaderboard"];

function AppRoutes({ state, send }) {
  const navigate = useNavigate();

  React.useEffect(() => {
    // Don't override navigation for standalone pages
    if (STANDALONE_PATHS.some((p) => window.location.pathname.startsWith(p))) return;

    if (state.matches("home")) navigate("/");
    if (state.matches("create")) navigate("/create");
    if (state.matches("join")) navigate("/join");
    if (state.matches("game") && state.context.gameId) {
      const playerNum = state.context.playerNum || "";
      navigate(
        `/game/${state.context.gameId}${playerNum ? `/${playerNum}` : ""}`
      );
    }
  }, [state, navigate]);

  return (
    <Routes>
      <Route path="/" element={<HomePage send={send} state={state} />} />
      <Route
        path="/create"
        element={
          <CreateGamePage
            send={send}
            state={state}
            loading={state.context.loading}
            error={state.context.error}
          />
        }
      />
      <Route
        path="/join"
        element={
          <JoinGamePage
            send={send}
            state={state}
            loading={state.context.loading}
            error={state.context.error}
          />
        }
      />
      <Route
        path="/game/:gameId/:playerNum?"
        element={<GamePage send={send} state={state} />}
      />
      <Route path="/daily" element={<DailyChallenge />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
    </Routes>
  );
}

function App() {
  const [state, send] = useMachine(gameMachine);

  console.log(state, "state");
  return <AppRoutes state={state} send={send} />;
}

export default App;
