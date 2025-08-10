# Backend API Integration Guide

This document describes how to integrate the frontend with the backend APIs for the Guess Number game. All endpoints are prefixed with the backend server URL (e.g., `http://localhost:8080`).

---

## 1. Create Game

- **Endpoint:** `POST /create_game`
- **Description:** Creates a new game and registers the first player.
- **Request Payload:**
  ```json
  {
    "player_info": {
      // any player info (e.g., name, id, etc.)
    }
  }
  ```
- **Response:**
  - **201 Created**
    ```json
    {
      "game_id": "1234"
    }
    ```

---

## 2. Join Game

- **Endpoint:** `POST /join_game/<game_id>`
- **Description:** Joins an existing game as the second player.
- **Request Payload:**
  ```json
  {
    "player_info": {
      // any player info (e.g., name, id, etc.)
    }
  }
  ```
- **Response:**
  - **200 OK**
    ```json
    {
      "message": "Joined game successfully"
    }
    ```
  - **404 Not Found**
    ```json
    {
      "error": "Game not found"
    }
    ```
  - **400 Bad Request**
    ```json
    {
      "error": "Game already has two players"
    }
    ```

---

## 3. Make Guess

- **Endpoint:** `POST /make_guess/<game_id>`
- **Description:** Submit a guess for the current player. The guess result (correct digits and positions) should be validated on the client and sent with the request.
- **Request Payload:**
  ```json
  {
    "guess": <number>,
    "player": "player1" | "player2",
    "correct_digits": <number>,
    "correct_positions": <number>
  }
  ```
- **Response:**
  - **200 OK**
    ```json
    {
      "player1": {...},
      "player2": {...},
      "turn": "player1" | "player2",
      "player1Turns": [
        { "guess": <number>, "correct_digits": <number>, "correct_positions": <number> },
        // ...
      ],
      "player2Turns": [
        { "guess": <number>, "correct_digits": <number>, "correct_positions": <number> },
        // ...
      ],
      "gameStatus": "ongoing" | "finished"
    }
    ```
  - **404 Not Found**
    ```json
    {
      "error": "Game not found"
    }
    ```
  - **400 Bad Request**
    ```json
    {
      "error": "Game has already finished"
    }
    ```

---

## 4. Get Game Status

- **Endpoint:** `GET /game_status/<game_id>`
- **Description:** Fetch the current state of the game.
- **Response:**
  - **200 OK**
    ```json
    {
      "player1": {...},
      "player2": {...},
      "turn": "player1" | "player2",
      "player1Turns": [
        { "guess": <number>, "correct_digits": <number>, "correct_positions": <number> },
        // ...
      ],
      "player2Turns": [
        { "guess": <number>, "correct_digits": <number>, "correct_positions": <number> },
        // ...
      ],
      "gameStatus": "ongoing" | "finished"
    }
    ```
  - **404 Not Found**
    ```json
    {
      "error": "Game not found"
    }
    ```

---

## Notes

- All requests and responses are in JSON.
- Use appropriate HTTP methods and status codes.
- `player_info` can be any object (e.g., `{ "name": "Alice" }`).
- `game_id` is a 4-digit string returned by the backend.
- The `turn` field indicates whose turn it is.
- The `gameStatus` field will be `ongoing` or `finished`.
- Guess validation and result logic is handled on the client; send `correct_digits` and `correct_positions` in the request payload for guesses.

For any further questions, refer to this document before reaching out to the backend team.
