import { createMachine, assign } from "xstate";
import * as actors from "./actors";

const gameMachine = createMachine({
  id: "game",
  initial: "home",
  context: {
    gameData: null,
    loading: false,
    error: null,
    gameId: null,
    playerInfo: null,
    player: null,
    guess: null,
    correct_digits: null,
    correct_positions: null,
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
              correct_digits: context.correct_digits,
              correct_positions: context.correct_positions,
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
