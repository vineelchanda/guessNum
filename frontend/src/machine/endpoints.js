// src/machine/endpoints.js

const BASE_URL = "https://guessnum-975779030831.asia-south1.run.app";

export const ENDPOINTS = {
  CREATE_GAME: `${BASE_URL}/create_game`,
  JOIN_GAME: (gameId) => `${BASE_URL}/join_game/${gameId}`,
  MAKE_GUESS: (gameId) => `${BASE_URL}/make_guess/${gameId}`,
  GAME_STATUS: (gameId) => `${BASE_URL}/game_status/${gameId}`,
};

export default ENDPOINTS;
