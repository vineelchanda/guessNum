// src/machine/endpoints.js

const BASE_URL = "https://guessnum-975779030831.asia-south1.run.app";

export const ENDPOINTS = {
  CREATE_GAME: `${BASE_URL}/create_game`,
  JOIN_GAME: (gameId) => `${BASE_URL}/join_game/${gameId}`,
  MAKE_GUESS: (gameId) => `${BASE_URL}/submit_guess/${gameId}`,
  GAME_STATUS: (gameId) => `${BASE_URL}/game_status/${gameId}`,
  VALIDATE_GUESS: (gameId) => `${BASE_URL}/validate_guess/${gameId}`,
};

export default ENDPOINTS;
