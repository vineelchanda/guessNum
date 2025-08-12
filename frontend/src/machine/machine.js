import { createMachine, assign } from "xstate";
import { actions, entryActions } from "./actions";
// import ENDPOINTS from "./endpoints";

// Utility to validate guess: returns { correct_digits, correct_positions }
// function validateGuess(guess, answer) {
//   if (!guess || !answer) return { correct_digits: 0, correct_positions: 0 };
//   const guessArr = guess.toString().split("");
//   const answerArr = answer.toString().split("");
//   let correct_positions = 0;
//   let correct_digits = 0;
//   const answerCount = {};
//   const guessCount = {};

//   // First pass: count correct positions
//   for (let i = 0; i < Math.min(guessArr.length, answerArr.length); i++) {
//     if (guessArr[i] === answerArr[i]) {
//       correct_positions++;
//     } else {
//       answerCount[answerArr[i]] = (answerCount[answerArr[i]] || 0) + 1;
//       guessCount[guessArr[i]] = (guessCount[guessArr[i]] || 0) + 1;
//     }
//   }
//   // Second pass: count correct digits (excluding already matched positions)
//   for (const digit in guessCount) {
//     if (answerCount[digit]) {
//       correct_digits += Math.min(guessCount[digit], answerCount[digit]);
//     }
//   }
//   // Add correct_positions to correct_digits (since those are also correct digits)
//   correct_digits += correct_positions;
//   return { correct_digits, correct_positions };
// }

function getInitialPageFromPath() {
  if (
    typeof window !== "undefined" &&
    window.location &&
    window.location.pathname
  ) {
    const path = window.location.pathname;
    if (path.startsWith("/create")) return "create";
    if (path.startsWith("/join")) return "join";
    if (path.startsWith("/game")) return "game";
  }
  return "home";
}

const gameMachine = createMachine({
  id: "game",
  initial: "determiningInitialPage",
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
    isSystemGame: false,
  },
  states: {
    determiningInitialPage: {
      always: [
        {
          target: "create",
          guard: () => getInitialPageFromPath() === "create",
        },
        { target: "join", guard: () => getInitialPageFromPath() === "join" },
        { target: "game", guard: () => getInitialPageFromPath() === "game" },
        { target: "home" },
      ],
    },
    home: {
      id: "home",
      on: {
        GO_TO_CREATE: {
          target: "create",
          actions: assign(({ context, event }) => ({
            isSystemGame: event.isSystemGame || false,
          })),
        },
        GO_TO_JOIN: "join",
      },
    },
    create: {
      id: "create",
      initial: "idle",
      states: {
        idle: {
          on: {
            CREATE_GAME: [
              {
                target: "creatingSystem",
                guard: ({ context }) => context.isSystemGame,
                actions: actions.assignCreateGame,
              },
              {
                target: "creating",
                actions: actions.assignCreateGame,
              },
            ],
          },
        },
        creating: {
          entry: entryActions.setLoading,
          invoke: {
            id: "createGame",
            src: "createGame",
            input: ({ context }) => ({ playerInfo: context.playerInfo }),
            onDone: {
              target: "success",
              actions: assign({
                gameId: ({ context, event }) => {
                  // Redirect to /game/:gameId/1 after creation
                  if (typeof window !== "undefined" && event.output?.game_id) {
                    window.history.replaceState(
                      {},
                      "",
                      `/game/${event.output.game_id}/1`
                    );
                  }
                  return event.output.game_id;
                },
                playerNum: () => "1",
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
        creatingSystem: {
          entry: entryActions.setLoading,
          invoke: {
            id: "createGameVsSystem",
            src: "createGameVsSystem",
            input: ({ context }) => ({ playerInfo: context.playerInfo }),
            onDone: {
              target: "success",
              actions: assign({
                gameId: ({ context, event }) => {
                  // Redirect to /game/:gameId/1 after creation
                  if (typeof window !== "undefined" && event.output?.game_id) {
                    window.history.replaceState(
                      {},
                      "",
                      `/game/${event.output.game_id}/1`
                    );
                  }
                  return event.output.game_id;
                },
                playerNum: () => "1",
                loading: ({ context, event }) => false,
                error: ({ context, event }) => null,
                isSystemGame: () => true,
              }),
            },
            onError: {
              target: "failure",
              actions: assign({
                error: ({ context, event }) =>
                  event.output?.message ||
                  event.output ||
                  "Failed to create system game",
                loading: ({ context, event }) => false,
              }),
            },
          },
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
              actions: actions.assignJoinGame,
            },
          },
        },
        joining: {
          entry: entryActions.setLoading,
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
                playerNum: () => "2",
                gameId: ({ context, event }) => {
                  // Redirect to /game/:gameId/2 after joining
                  if (typeof window !== "undefined" && context.gameId) {
                    window.history.replaceState(
                      {},
                      "",
                      `/game/${context.gameId}/2`
                    );
                  }
                  return context.gameId;
                },
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
      entry: assign(({ context }) => {
        if (
          (!context.gameId || !context.playerNum) &&
          typeof window !== "undefined" &&
          window.location &&
          window.location.pathname
        ) {
          // Support /game/:gameId or /game/:gameId/:playerNum
          const match = window.location.pathname.match(
            /\/game\/(\w+)(?:\/(\d))?/
          );
          if (match && match[1]) {
            return { ...context, gameId: match[1], playerNum: match[2] };
          }
        }
        return context;
      }),
      states: {
        idle: {
          on: {
            MAKE_GUESS: {
              target: "makingGuess",
              actions: actions.assignMakeGuess,
            },
            FETCH_STATUS: "fetchingStatus",
            GAME_DATA_CHANGED: {
              actions: actions.assignGameDataChanged,
            },
          },
        },
        makingGuess: {
          entry: entryActions.setLoading,
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
                // gameData: ({ context, event }) => event.output,
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
          entry: entryActions.setLoading,
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
