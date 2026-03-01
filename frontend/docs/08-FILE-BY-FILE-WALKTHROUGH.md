# File-by-File Walkthrough

Read each file in this order for the best learning experience.

---

## Reading Order (Recommended)

```
1. main.jsx              ← Where React starts (5 lines)
2. App.jsx               ← Root component + routing (68 lines)
3. HomePage.jsx          ← Simplest page (87 lines)
4. CreateGame.jsx        ← Forms + validation (260 lines)
5. JoinGame.jsx          ← Similar to CreateGame (259 lines)
6. firebase.js           ← Firebase config (26 lines)
7. utils/index.js        ← Real-time listener (13 lines)
8. endpoints.js          ← API URLs (16 lines)
9. actors.js             ← API call functions (75 lines)
10. actions.js           ← State update logic (81 lines)
11. machine.js           ← State machine definition (405 lines)
12. machine/index.js     ← Machine export with actors (tiny)
13. Game.jsx             ← Most complex component (700 lines)
14. ScratchPad.jsx       ← Self-contained helper (251 lines)
```

---

## 1. main.jsx — The Entry Point

**Location:** `src/main.jsx` (10 lines)

**What it does:** This is where React boots up. It tells React to take control
of the `<div id="root">` in index.html and render the App component inside it.

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Router>
    <App />
  </Router>
);
```

**Concepts:**
- `ReactDOM.createRoot()` — Creates a React rendering root
- `<Router>` — Wraps the entire app to enable URL routing
- This file is referenced in `index.html` via `<script type="module" src="/src/main.jsx">`

---

## 2. App.jsx — The Brain

**Location:** `src/App.jsx` (68 lines)

**What it does:** Creates the state machine and sets up routing.

**Key lines:**
- Line 62: `const [state, send] = useMachine(gameMachine)` — Creates the machine
- Lines 15-26: `useEffect` syncs machine state → URL
- Lines 28-58: `<Routes>` maps URLs to page components

**Two components in one file:**
- `App` — owns the machine, renders AppRoutes
- `AppRoutes` — needs `useNavigate()` which requires Router context

---

## 3. HomePage.jsx — The Landing Page

**Location:** `src/pages/Home/HomePage.jsx` (87 lines)

**What it does:** Shows 3 cards: Create Game, Play vs System, Join Game.

**Concepts to learn here:**
- CSS Modules: `import styles from "./HomePage.module.css"` (line 2)
- Using CSS module classes: `className={styles.homePage}` (line 7)
- Conditional className: `hovered === "create" ? \`${styles.button} ${styles.buttonActive}\` : styles.button` (lines 29-33)
- Event sending: `onClick={() => send({ type: "GO_TO_CREATE" })}` (line 37)
- Passing payload with event: `send({ type: "GO_TO_CREATE", isSystemGame: true })` (line 56)

---

## 4. CreateGame.jsx — Forms & Validation

**Location:** `src/pages/CreateGame/CreateGame.jsx` (260 lines)

**What it does:** Form to enter name + 4-digit number, creates a game.

**Concepts to learn here:**
- Controlled inputs (lines 146-162, 163-198)
- Form submission with `e.preventDefault()` (line 15)
- Input validation while typing (lines 167-183)
- Conditional rendering based on loading state (lines 218-231)
- Inline styles as JavaScript objects (throughout)
- Responsive CSS via `<style>` tag inside JSX (lines 40-58)
- Reading machine context: `state?.context?.isSystemGame` (line 8)

---

## 5. JoinGame.jsx — URL Parameter Reading

**Location:** `src/pages/JoinGame/JoinGame.jsx` (259 lines)

**Concepts to learn here:**
- useState with initializer function (lines 4-10):
  Reads `?gameId=abc123` from URL on first render
- URLSearchParams API for reading query strings
- Same form patterns as CreateGame

---

## 6. firebase.js — External Service Config

**Location:** `src/firebase.js` (26 lines)

**What it does:** Initializes Firebase and exports the Firestore database.

**Concepts:**
- Named exports: `export { app, db }` (line 25)
- Module initialization: code runs once when first imported

---

## 7. utils/index.js — Real-Time Listener

**Location:** `src/utils/index.js` (13 lines)

**What it does:** Wraps Firebase's `onSnapshot` into a reusable function.

```jsx
export function listenToGame(gameId, onChange) {
  const unsub = onSnapshot(doc(db, "games", gameId), (docSnap) => {
    if (docSnap.exists()) {
      onChange(docSnap.data());  // Call the callback with new data
    }
  });
  return unsub;  // Return unsubscribe function
}
```

**Concepts:**
- Callback pattern: accepts a function and calls it when data arrives
- Returns cleanup function (used in useEffect)

---

## 8. endpoints.js — API Constants

**Location:** `src/machine/endpoints.js` (16 lines)

**Concepts:**
- Template literal functions: `JOIN_GAME: (gameId) => \`${BASE_URL}/join_game/${gameId}\``
- Constants vs functions: static URLs are strings, dynamic ones are functions

---

## 9. actors.js — API Call Functions

**Location:** `src/machine/actors.js` (75 lines)

**What it does:** Each function makes a fetch() call to the backend.

**Concepts:**
- `fromPromise` — XState wrapper that turns an async function into an actor
- async/await pattern
- `fetch()` API for HTTP requests
- Error handling: check `response.ok`, throw on failure
- JSON request/response: `headers: { "Content-Type": "application/json" }`

---

## 10. actions.js — State Update Logic

**Location:** `src/machine/actions.js` (81 lines)

**What it does:** Defines what happens to the machine's context when events occur.

**Key concept — `assign()`:**
```jsx
assign(({ context, event }) => ({
  playerInfo: event.playerInfo,  // Update context field from event data
  error: null,                    // Clear error
}))
```
`assign()` is XState's way of updating context. It's similar to calling
`setState` but for the machine.

**Most complex action — `assignGameDataChanged` (lines 30-79):**
- Receives Firebase data
- Determines which player you are
- Determines if it's your turn
- Triggers server-side validation if needed

---

## 11. machine.js — The State Machine

**Location:** `src/machine/machine.js` (405 lines)

**What it does:** Defines ALL states, transitions, and async operations.

**This is the most important file to understand.** Read it alongside the
flowchart in `04-STATE-MANAGEMENT.md`.

**Key concepts:**
- `createMachine()` — Defines the machine
- `initial: "determiningInitialPage"` — Starting state
- `context: { ... }` — Global data
- `states: { ... }` — All possible states
- `on: { EVENT: "targetState" }` — Transitions
- `invoke: { src, onDone, onError }` — Async operations
- `guard: () => boolean` — Conditional transitions
- `always: [...]` — Automatic transitions (no event needed)
- Nested states: `create.idle`, `create.creating`, `create.success`

---

## 12. Game.jsx — The Main Game Screen

**Location:** `src/pages/Game/Game.jsx` (700 lines)

**The most complex component.** Concepts to study:

| Lines     | Concept                          |
|-----------|----------------------------------|
| 1-5       | Multiple hook imports            |
| 7-16      | Multiple useState + useRef       |
| 17        | Destructuring from machine context|
| 24-31     | useEffect with Firebase listener |
| 34-55     | useEffect with timer + cleanup   |
| 58-62     | useEffect syncing with machine   |
| 64-87     | Input focus management with refs |
| 89-114    | Form validation + submission     |
| 126-145   | Helper function for rendering    |
| 167-196   | Winner detection logic           |
| 230-696   | JSX with conditional rendering   |
| 246-298   | Copy to clipboard feature        |
| 576-604   | Pin input with auto-focus        |

---

## 13. ScratchPad.jsx — Self-Contained Widget

**Location:** `src/pages/Game/ScratchPad.jsx` (251 lines)

**What it does:** Standalone helper tool. Only communicates with parent
via `onFillGuess` callback prop.

**Concepts:**
- Complex array state management
- 2D grid state (4x4 boolean matrix)
- Derived/computed values from state
- State cycling pattern (null → tick → cross → null)
- Completely self-contained component (manages its own state)

---

## Complexity Ranking

```
Simplest ──────────────────────────────────────── Most Complex

main.jsx  →  firebase.js  →  endpoints.js  →  utils/index.js
    │              │              │                 │
  5 lines      26 lines      16 lines          13 lines

    →  HomePage.jsx  →  JoinGame.jsx  →  CreateGame.jsx
           │                 │                │
        87 lines         259 lines        260 lines

    →  actors.js  →  actions.js  →  ScratchPad.jsx
          │              │              │
       75 lines       81 lines       251 lines

    →  machine.js  →  App.jsx  →  Game.jsx
          │              │            │
       405 lines      68 lines     700 lines
```
