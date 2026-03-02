// src/machine/endpoints.js

const BASE_URL = "https://guessnum-975779030831.asia-south1.run.app";

export const ENDPOINTS = {
  CREATE_GAME: `${BASE_URL}/create_game`,
  CREATE_GAME_VS_SYSTEM: `${BASE_URL}/create_game_vs_system`,
  JOIN_GAME: (gameId) => `${BASE_URL}/join_game/${gameId}`,
  MAKE_GUESS: (gameId) => `${BASE_URL}/submit_guess/${gameId}`,
  GAME_STATUS: (gameId) => `${BASE_URL}/game_status/${gameId}`,
  VALIDATE_GUESS: (gameId) => `${BASE_URL}/validate_guess/${gameId}`,
  EXPIRE_GAME: (gameId) => `${BASE_URL}/expire_game/${gameId}`,
  DAILY_CHALLENGE_START: `${BASE_URL}/daily_challenge/start`,
  DAILY_CHALLENGE_GUESS: (gameId) => `${BASE_URL}/daily_challenge/guess/${gameId}`,
  DAILY_LEADERBOARD: `${BASE_URL}/daily_leaderboard`,
};

export default ENDPOINTS;
