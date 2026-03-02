# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GuessNum is a full-stack multiplayer number guessing game (Mastermind-style) where players pick a unique 4-digit number and try to guess each other's number. Supports player-vs-player and player-vs-AI modes.

## Commands

### Frontend (`frontend/`)
```bash
npm install        # Install dependencies
npm run dev        # Dev server at http://localhost:5173
npm run build      # Production build to dist/
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

### Backend (`backend/`)
```bash
pip install -r requirements.txt   # Install dependencies
python app.py                      # Dev server at http://0.0.0.0:8080
```

### Docker
```bash
# Backend
docker build -t python-game-app ./backend
docker run -p 8080:8080 python-game-app

# Frontend
docker build -t guessnum-frontend ./frontend
docker run -p 8080:8080 guessnum-frontend
```

## Architecture

### Stack
- **Frontend**: React 19 + Vite, XState 5 for state management, Tailwind CSS 4, Firebase SDK for Firestore real-time listener, React Router DOM
- **Backend**: Python Flask, firebase-admin SDK, Flasgger (Swagger docs)
- **Database**: Google Firestore (real-time NoSQL)

### Data Flow
1. **Create game**: POST `/create_game` → Firestore doc created → return `game_id`
2. **Join game**: POST `/join_game/{gameId}` → Firestore updated
3. **Gameplay**: POST `/submit_guess/{gameId}` → backend validates & updates Firestore → frontend Firestore listener detects change → XState receives `GAME_DATA_CHANGED` event

### Frontend State Machine (`frontend/src/machine/`)
The entire frontend state is managed by a single XState statechart:
- **`machine.js`**: State definitions and transitions (home → create/join → game, with nested async states)
- **`actions.js`**: Context update functions called on transitions
- **`actors.js`**: Async actors that wrap API calls (promise-based)
- **`endpoints.js`**: Centralized API URL definitions
- **`index.js`**: Machine provider that injects actors

The Game page sets up a Firestore real-time listener (`frontend/src/utils/index.js`) and sends `GAME_DATA_CHANGED` events into the machine when Firestore updates arrive.

### Backend Routes (`backend/routes/`)
- **`game.py`**: `/create_game`, `/create_game_vs_system`, `/join_game/{gameId}`, `/game_status/{gameId}`, `/expire_game/{gameId}`
- **`gameplay.py`**: `/submit_guess/{gameId}`, `/validate_guess/{gameId}`
- **`system_player.py`**: AI opponent logic — maintains candidate set from 4-digit unique-number space, filters by previous guess feedback using constraint solver

### Game Rules (enforced in backend)
- All 4 digits must be unique (validated server-side)
- Players alternate turns
- Feedback per guess: count of correct digits + count of correct positions
- Games expire after 30 minutes of inactivity

## Key Files
- `backend/app.py` — Flask app setup, CORS (all origins allowed), Swagger, health endpoint
- `backend/database.py` — Firestore client initialization
- `frontend/src/App.jsx` — React Router routes, XState machine provider
- `frontend/src/firebase.js` — Firebase/Firestore client config
- `frontend/src/machine/machine.js` — Complete game state machine

## API Documentation
Swagger docs available at `/apidocs` when backend is running. YAML specs in `backend/docs/`.
