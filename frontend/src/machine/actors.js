// src/machine/actors.js
import ENDPOINTS from "./endpoints";
import { fromPromise } from "xstate";

export const createGame = fromPromise(async ({ input }) => {
  const { name, fourDigit } = input.playerInfo;
  const response = await fetch(ENDPOINTS.CREATE_GAME, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player_info: { name, number: fourDigit } }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create game");
  }

  return response.json();
});

export const createGameVsSystem = fromPromise(async ({ input }) => {
  const { name, fourDigit } = input.playerInfo;
  const response = await fetch(ENDPOINTS.CREATE_GAME_VS_SYSTEM, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player_info: { name, number: fourDigit } }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create system game");
  }

  return response.json();
});

export const joinGame = fromPromise(async ({ input }) => {
  const { name, fourDigit } = input.playerInfo;
  const response = await fetch(ENDPOINTS.JOIN_GAME(input.gameId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player_info: { name, number: fourDigit } }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to join game");
  }
  return response.json();
});

export const makeGuess = fromPromise(async ({ input }) => {
  const response = await fetch(ENDPOINTS.MAKE_GUESS(input.gameId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      guess: input.guess,
      player: input.player,
      correct_digits: input.correct_digits,
      correct_positions: input.correct_positions,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to make guess");
  }
  return response.json();
});

export const getGameStatus = fromPromise(async ({ input }) => {
  const response = await fetch(ENDPOINTS.GAME_STATUS(input.gameId));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get game status");
  }
  return response.json();
});
