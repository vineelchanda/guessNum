// Entry actions for loading and error
export const entryActions = {
  setLoading: assign({ loading: () => true, error: () => null }),
};

// All XState actions for the game machine
import { assign } from "xstate";
import ENDPOINTS from "./endpoints";

export const actions = {
  assignCreateGame: assign(({ context, event }) => {
    console.log(context, event, "evt");
    return {
      playerInfo: event.playerInfo,
      error: null,
    };
  }),
  assignJoinGame: assign(({ event }) => ({
    gameId: event.gameId,
    playerInfo: event.playerInfo,
    error: null,
  })),
  assignMakeGuess: assign(({ event }) => ({
    guess: event.guess,
    player: event.player,
    correct_digits: event.correct_digits,
    correct_positions: event.correct_positions,
    error: null,
  })),
  assignGameDataChanged: assign(({ context, event }) => {
    const gameData = event.data;
    let playerInfo = context.playerInfo;
    // If playerInfo is empty, set it from gameData based on playerNum
    if (!playerInfo || !playerInfo.name) {
      if (context.playerNum === "1" && gameData?.player1) {
        playerInfo = { ...gameData.player1 };
      } else if (context.playerNum === "2" && gameData?.player2) {
        playerInfo = { ...gameData.player2 };
      }
    }
    let playerRole = null;
    let isMyTurn = false;
    if (playerInfo && playerInfo.name) {
      if (gameData?.player1?.name === playerInfo.name) playerRole = "player1";
      else if (gameData?.player2?.name === playerInfo.name)
        playerRole = "player2";
      if (
        (gameData?.turn === "player1" &&
          gameData?.player1?.name === playerInfo.name) ||
        (gameData?.turn === "player2" &&
          gameData?.player2?.name === playerInfo.name)
      ) {
        isMyTurn = true;
      }
    }

    // --- Guess validation: trigger server-side computation ---
    const phase = gameData?.gamePhase;
    const currentGuess = gameData?.currentGuess;
    const shouldValidate =
      (phase === "player1Validating" && playerRole === "player1") ||
      (phase === "player2Validating" && playerRole === "player2");

    if (shouldValidate && currentGuess) {
      // Server computes correct_digits/correct_positions — we only send who is validating
      fetch(ENDPOINTS.VALIDATE_GUESS(context.gameId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player: playerRole }),
      }).catch(() => {});
    }

    return {
      gameData,
      playerRole,
      isMyTurn,
      isSystemGame: gameData?.isSystemGame || context.isSystemGame,
    };
  }),
};
