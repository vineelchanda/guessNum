import React from "react";
import { useMachine } from "@xstate/react";
import { Routes, Route, useNavigate } from "react-router-dom";
import HomePage from "./pages/Home";
import CreateGamePage from "./pages/CreateGame";
import JoinGamePage from "./pages/JoinGame";
import GamePage from "./pages/Game";
import gameMachine from "./machine";
import "./App.css";
// import { db } from "./firebase"; // Import Firebase app and db if needed

function AppRoutes({ state, send }) {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (state.matches("home")) navigate("/");
    if (state.matches("create")) navigate("/create");
    if (state.matches("join")) navigate("/join");
    if (state.matches("game") && state.context.gameId) {
      // If playerNum is set in context, use it in the URL
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
    </Routes>
  );
}

function App() {
  const [state, send] = useMachine(gameMachine);

  return <AppRoutes state={state} send={send} />;
}

export default App;
