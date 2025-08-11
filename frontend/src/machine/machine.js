import { createMachine, assign } from "xstate";
import * as actors from "./actors";
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

  // First pass: count correct positions
  for (let i = 0; i < Math.min(guessArr.length, answerArr.length); i++) {
    if (guessArr[i] === answerArr[i]) {
      correct_positions++;
    } else {
      answerCount[answerArr[i]] = (answerCount[answerArr[i]] || 0) + 1;
      guessCount[guessArr[i]] = (guessCount[guessArr[i]] || 0) + 1;
    }
  }
  // Second pass: count correct digits (excluding already matched positions)
  for (const digit in guessCount) {
    if (answerCount[digit]) {
      correct_digits += Math.min(guessCount[digit], answerCount[digit]);
    }
  }
  // Add correct_positions to correct_digits (since those are also correct digits)
  correct_digits += correct_positions;
  return { correct_digits, correct_positions };
}

const gameMachine = createMachine({
  id: "game",
  initial: "home",
  context: {
    gameData: null,
    loading: false,
    error: null,
    gameId: null,
    playerInfo: null, // { name: string }
    player: null,
    guess: null,
    correct_digits: null,
    correct_positions: null,
    playerRole: null, // 'player1' | 'player2' | null
    isMyTurn: false,
  },
  states: {
    home: {
      id: "home",
      on: {
        GO_TO_CREATE: "create",
        GO_TO_JOIN: "join",
      },
    },
    create: {
      id: "create",
      initial: "idle",
      states: {
        idle: {
          on: {
            CREATE_GAME: {
              target: "creating",
              actions: assign(({ context, event }) => {
                console.log(context, event, "evt");
                return {
                  playerInfo: event.playerInfo,
                  error: null,
                };
              }),
            },
          },
        },
        creating: {
          entry: assign({ loading: (_) => true, error: (_) => null }),
          invoke: {
            id: "createGame",
            src: "createGame",
            input: ({ context }) => ({ playerInfo: context.playerInfo }),
            onDone: {
              target: "success",
              actions: assign({
                gameId: ({ context, event }) => {
                  console.log(event);
                  return event.output.game_id;
                },
                loading: ({ context, event }) => false,
                error: ({ context, event }) => null,
              }),
            },
            onError: {
              target: "failure",
              actions: assign({
                error: ({ context, event }) =>
                  event.output?.message ||
                  event.output ||
                  "Failed to create game",
                loading: ({ context, event }) => false,
              }),
            },
          },
        },
        success: {
          always: "#game",
        },
        failure: {
          on: {
            RETRY: "creating",
            GO_TO_HOME: "idle",
          },
        },
      },
      on: {
        GO_TO_HOME: "home",
        GO_TO_GAME: "game",
      },
    },
    join: {
      id: "join",
      initial: "idle",
      states: {
        idle: {
          on: {
            JOIN_GAME: {
              target: "joining",
              actions: assign(({ context, event }) => ({
                gameId: event.gameId,
                playerInfo: event.playerInfo,
                error: null,
              })),
            },
          },
        },
        joining: {
          entry: assign({ loading: (_) => true, error: (_) => null }),
          invoke: {
            id: "joinGame",
            src: "joinGame",
            input: ({ context }) => ({
              gameId: context.gameId,
              playerInfo: context.playerInfo,
            }),
            onDone: {
              target: "success",
              actions: assign({
                loading: ({ context, event }) => false,
                error: ({ context, event }) => null,
              }),
            },
            onError: {
              target: "failure",
              actions: assign({
                error: ({ context, event }) =>
                  event.output?.message ||
                  event.output ||
                  "Failed to join game",
                loading: ({ context, event }) => false,
              }),
            },
          },
        },
        success: {
          always: "#game",
        },
        failure: {
          on: {
            RETRY: "joining",
            GO_TO_HOME: "idle",
          },
        },
      },
      on: {
        GO_TO_HOME: "home",
        GO_TO_GAME: "game",
      },
    },
    game: {
      id: "game",
      initial: "idle",
      states: {
        idle: {
          on: {
            MAKE_GUESS: {
              target: "makingGuess",
              actions: assign(({ context, event }) => ({
                guess: event.guess,
                player: event.player,
                correct_digits: event.correct_digits,
                correct_positions: event.correct_positions,
                error: null,
              })),
            },
            FETCH_STATUS: "fetchingStatus",
            GAME_DATA_CHANGED: {
              actions: assign(({ context, event }) => {
                const gameData = event.data;
                const playerInfo = context.playerInfo;
                let playerRole = null;
                let isMyTurn = false;
                if (playerInfo && playerInfo.name) {
                  if (gameData?.player1?.name === playerInfo.name)
                    playerRole = "player1";
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
                // If phase is player1Validating or player2Validating and this player is the validator
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
                  // Get the validator's secret number
                  // answer = gameData?.currentGuess?.guess;
                  if (playerRole === "player1") {
                    answer = gameData?.player1.number;
                  } else if (playerRole === "player2") {
                    answer = gameData?.player2.number;
                  }
                }

                if (shouldValidate && currentGuess && answer) {
                  // Validate guess
                  const { correct_digits, correct_positions } = validateGuess(
                    currentGuess.guess,
                    answer
                  );
                  // Send result to backend
                  // Use ENDPOINTS.VALIDATE_GUESS from endpoints.js
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
            },
          },
        },
        makingGuess: {
          entry: assign({ loading: (_) => true, error: (_) => null }),
          invoke: {
            id: "makeGuess",
            src: "makeGuess",
            input: ({ context }) => ({
              gameId: context.gameId,
              guess: context.guess,
              player: context.player,
              // correct_digits: context.correct_digits,
              // correct_positions: context.correct_positions,
            }),
            onDone: {
              target: "idle",
              actions: assign({
                gameData: ({ context, event }) => event.output,
                loading: ({ context, event }) => false,
                error: ({ context, event }) => null,
                correct_digits: ({ context, event }) => null,
                correct_positions: ({ context, event }) => null,
                guess: ({ context, event }) => null,
              }),
            },
            onError: {
              target: "failure",
              actions: assign({
                error: ({ context, event }) =>
                  event.output?.message ||
                  event.output ||
                  "Failed to make guess",
                loading: ({ context, event }) => false,
              }),
            },
          },
        },
        fetchingStatus: {
          entry: assign({ loading: (_) => true, error: (_) => null }),
          invoke: {
            id: "getGameStatus",
            src: "getGameStatus",
            input: ({ context }) => ({ gameId: context.gameId }),
            onDone: {
              target: "idle",
              actions: assign({
                gameData: ({ context, event }) => event.output,
                loading: ({ context, event }) => false,
                error: ({ context, event }) => null,
                // Determine playerRole and isMyTurn
                playerRole: ({ context, event }) => {
                  const { playerInfo } = context;
                  const { player1, player2 } = event.output || {};
                  if (!playerInfo || !playerInfo.name) return null;
                  if (player1 && player1.name === playerInfo.name)
                    return "player1";
                  if (player2 && player2.name === playerInfo.name)
                    return "player2";
                  return null;
                },
                isMyTurn: ({ context, event }) => {
                  const { playerInfo } = context;
                  const { player1, player2, turn } = event.output || {};
                  if (!playerInfo || !playerInfo.name) return false;
                  if (
                    turn === "player1" &&
                    player1 &&
                    player1.name === playerInfo.name
                  )
                    return true;
                  if (
                    turn === "player2" &&
                    player2 &&
                    player2.name === playerInfo.name
                  )
                    return true;
                  return false;
                },
              }),
            },
            onError: {
              target: "failure",
              actions: assign({
                error: ({ context, event }) =>
                  event.output?.message ||
                  event.output ||
                  "Failed to fetch status",
                loading: ({ context, event }) => false,
              }),
            },
          },
        },
        failure: {
          on: {
            RETRY: "idle",
            // GO_TO_HOME: "#game.home",
          },
        },
      },
      on: {
        GO_TO_HOME: "home",
      },
    },
  },
});

export default gameMachine;
