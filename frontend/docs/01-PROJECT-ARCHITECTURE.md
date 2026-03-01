# GuessNum - Project Architecture Overview

## What is this project?

GuessNum is a **multiplayer number-guessing game** where two players each pick a
secret 4-digit number (all digits unique). They take turns guessing the
opponent's number and receive feedback: how many digits are correct and how many
are in the correct position. The first player to guess all 4 digits in the right
positions wins.

---

## Tech Stack at a Glance

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│                                                         │
│  React 19  ─  The UI library (components, hooks)        │
│  Vite 7    ─  Build tool & dev server (like Webpack     │
│               but much faster)                          │
│  XState 5  ─  State machine (manages app state &        │
│               transitions like a flowchart)             │
│  React Router 7  ─  URL-based navigation (/, /create,   │
│                      /join, /game/:id)                  │
│  Firebase Firestore  ─  Real-time database (live game   │
│                          updates without refreshing)    │
│  Tailwind CSS 4  ─  Utility-first CSS framework         │
│                                                         │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (fetch)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                      BACKEND                            │
│                                                         │
│  Google Cloud Run API                                   │
│  Endpoints: create_game, join_game, submit_guess, etc.  │
│  Stores game data in Firebase Firestore                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Directory Structure (Annotated)

```
frontend/
├── package.json          ← Dependencies & scripts (npm dev, build, etc.)
├── vite.config.js        ← Vite bundler config (plugins: React + Tailwind)
├── index.html            ← The single HTML file (React mounts into #root)
├── src/
│   ├── main.jsx          ← ENTRY POINT: React starts here
│   ├── App.jsx           ← ROOT COMPONENT: routing + state machine
│   ├── App.css           ← Global styles for App
│   ├── index.css          ← Tailwind CSS imports
│   ├── firebase.js       ← Firebase initialization & config
│   │
│   ├── components/       ← Reusable UI components
│   │   └── Background.jsx  (currently unused)
│   │
│   ├── pages/            ← One folder per page/screen
│   │   ├── Home/
│   │   │   ├── index.jsx           ← Re-exports HomePage (clean imports)
│   │   │   ├── HomePage.jsx        ← Landing page with 3 action cards
│   │   │   └── HomePage.module.css ← Scoped CSS for HomePage only
│   │   ├── CreateGame/
│   │   │   ├── index.jsx           ← Re-exports CreateGame
│   │   │   └── CreateGame.jsx      ← Form to create a new game
│   │   ├── JoinGame/
│   │   │   ├── index.jsx           ← Re-exports JoinGame
│   │   │   └── JoinGame.jsx        ← Form to join an existing game
│   │   └── Game/
│   │       ├── index.jsx           ← Re-exports Game
│   │       ├── Game.jsx            ← Main game screen (biggest component)
│   │       ├── ScratchPad.jsx      ← Helper tool for digit elimination
│   │       └── ScratchPad.css      ← Styles for ScratchPad
│   │
│   ├── machine/          ← XState state machine (the "brain" of the app)
│   │   ├── index.js      ← Exports machine with actors wired up
│   │   ├── machine.js    ← State machine definition (states & transitions)
│   │   ├── actions.js    ← What happens when transitions occur
│   │   ├── actors.js     ← Async API calls (fetch to backend)
│   │   └── endpoints.js  ← API URL constants
│   │
│   └── utils/
│       └── index.js      ← Firebase real-time listener utility
│
├── public/               ← Static assets (served as-is)
└── docs/                 ← 📖 You are here! Learning materials
```

---

## How the Pieces Fit Together

```
     User opens browser
            │
            ▼
    ┌───────────────┐
    │   index.html  │   ← Has a <div id="root"></div>
    └───────┬───────┘
            │
            ▼
    ┌───────────────┐
    │   main.jsx    │   ← ReactDOM.createRoot(#root).render(<Router><App/></Router>)
    └───────┬───────┘
            │
            ▼
    ┌───────────────┐
    │   App.jsx     │   ← Creates the state machine, sets up routes
    │               │      Routes decide WHICH page to show based on URL
    └───┬───┬───┬───┘
        │   │   │
        ▼   ▼   ▼
    HomePage  CreateGame  JoinGame  GamePage   ← Each page is a component
        │         │          │         │
        └─────────┴──────────┴─────────┘
                      │
                      ▼
              ┌───────────────┐
              │  State Machine│   ← Controls which page is active,
              │  (XState)     │     handles API calls, stores game data
              └───────────────┘
```

---

## Key Architectural Decisions

### 1. Single Page Application (SPA)
There's only ONE HTML file (`index.html`). React handles all page transitions
in the browser — the page never fully reloads. This is what React Router does.

### 2. Centralized State Machine
Instead of spreading state across many components, this project uses XState
to manage ALL important state in one place. Components just `send` events
and read from the machine's `context`. Think of it like a control tower
that all components talk to.

### 3. Real-time Updates via Firebase
Instead of polling the server every few seconds ("are there updates?"),
Firebase Firestore pushes changes to the browser instantly. When your
opponent makes a guess, your screen updates automatically.

### 4. Backend-First Game Logic
The frontend NEVER computes game results (who won, how many digits are
correct). It always sends data to the backend API and displays what comes
back. This prevents cheating.
