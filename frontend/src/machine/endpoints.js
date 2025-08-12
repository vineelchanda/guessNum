// src/machine/endpoints.js

const BASE_URL = process.env.NODE_ENV === 'development' 
  ? "http://localhost:8080"  // Local development
  : "https://guessnum-975779030831.asia-south1.run.app";  // Production

export const ENDPOINTS = {
  CREATE_GAME: `${BASE_URL}/create_game`,
  CREATE_GAME_VS_SYSTEM: `${BASE_URL}/create_game_vs_system`,
  JOIN_GAME: (gameId) => `${BASE_URL}/join_game/${gameId}`,
  MAKE_GUESS: (gameId) => `${BASE_URL}/submit_guess/${gameId}`,
  GAME_STATUS: (gameId) => `${BASE_URL}/game_status/${gameId}`,
  VALIDATE_GUESS: (gameId) => `${BASE_URL}/validate_guess/${gameId}`,
  DAILY_CHALLENGE: `${BASE_URL}/daily_challenge`,
  DAILY_CHALLENGE_SUBMIT: `${BASE_URL}/daily_challenge/submit`,
};

export default ENDPOINTS;
