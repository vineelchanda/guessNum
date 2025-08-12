// Entry actions for loading and error
export const entryActions = {
  setLoading: assign({ loading: (_) => true, error: (_) => null }),
};
// All XState actions for the game machine
import { assign } from "xstate";
import ENDPOINTS from "./endpoints";

// Utility to validate guess: returns { correct_digits, correct_positions }
function validateGuess(guess, answer) {
  if (!guess || !answer) return { correct_digits: 0, correct_positions: 0 };
  const guessArr = guess.toString().split("");
  const answerArr = answer.toString().split("");
  let correct_positions = 0;
  let correct_digits = 0;
  const answerCount = {};
  const guessCount = {};

  for (let i = 0; i < Math.min(guessArr.length, answerArr.length); i++) {
    if (guessArr[i] === answerArr[i]) {
      correct_positions++;
    } else {
      answerCount[answerArr[i]] = (answerCount[answerArr[i]] || 0) + 1;
      guessCount[guessArr[i]] = (guessCount[guessArr[i]] || 0) + 1;
    }
  }
  for (const digit in guessCount) {
    if (answerCount[digit]) {
      correct_digits += Math.min(guessCount[digit], answerCount[digit]);
    }
  }
  correct_digits += correct_positions;
  return { correct_digits, correct_positions };
}

export const actions = {
  assignCreateGame: assign(({ context, event }) => {
    console.log(context, event, "evt");
    return {
      playerInfo: event.playerInfo,
      error: null,
    };
  }),
  assignJoinGame: assign(({ context, event }) => ({
    gameId: event.gameId,
    playerInfo: event.playerInfo,
    error: null,
  })),
  assignMakeGuess: assign(({ context, event }) => ({
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

    // --- Guess validation logic ---
    const phase = gameData?.gamePhase;
    const currentGuess = gameData?.currentGuess;
    let shouldValidate = false;
    let validator = null;
    let answer = null;
    if (
      (phase === "player1Validating" && playerRole === "player1") ||
      (phase === "player2Validating" && playerRole === "player2")
    ) {
      shouldValidate = true;
      validator = playerRole;
      if (playerRole === "player1") {
        answer = gameData?.player1?.number;
      } else if (playerRole === "player2") {
        answer = gameData?.player2?.number;
      }
    }

    if (shouldValidate && currentGuess && answer) {
      const { correct_digits, correct_positions } = validateGuess(
        currentGuess.guess,
        answer
      );
      fetch(ENDPOINTS.VALIDATE_GUESS(context.gameId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correct_digits,
          correct_positions,
          player: validator,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          // Optionally, trigger a status fetch or update UI
        })
        .catch((err) => {
          // Optionally, handle error
        });
    }

    return {
      gameData,
      playerRole,
      isMyTurn,
    };
  }),
};
