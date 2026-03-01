# State Management & XState Guide

## Two Kinds of State in This Project

```
┌─────────────────────────────────────────────────────────────┐
│                    STATE IN GUESSNUM                        │
│                                                             │
│  ┌─────────────────────┐    ┌────────────────────────────┐  │
│  │   LOCAL STATE       │    │   GLOBAL STATE             │  │
│  │   (useState)        │    │   (XState Machine)         │  │
│  │                     │    │                            │  │
│  │ Owned by ONE        │    │ Owned by App.jsx           │  │
│  │ component           │    │ Shared via props to        │  │
│  │                     │    │ ALL components             │  │
│  │ Examples:           │    │                            │  │
│  │ • playerName input  │    │ Examples:                  │  │
│  │ • pin digits        │    │ • gameData (from server)   │  │
│  │ • hover state       │    │ • gameId                   │  │
│  │ • timer countdown   │    │ • playerRole               │  │
│  │ • validation errors │    │ • isMyTurn                 │  │
│  │                     │    │ • which page is active     │  │
│  └─────────────────────┘    └────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## What is XState?

XState is a **state machine** library. Think of it like a flowchart that your
app follows. The app is always in ONE specific state, and can only move to
another state through defined transitions (events).

**Real-world analogy:** A traffic light.
- States: Red, Yellow, Green
- Transitions: Red → Green (after timer), Green → Yellow (after timer),
  Yellow → Red (after timer)
- You can't go from Red directly to Yellow — the rules don't allow it.

---

## The Game Machine Flowchart

```
┌──────────────────────────┐
│  determiningInitialPage  │  ← App starts here
│                          │    Checks the current URL
│  URL is /create? ────────┼──► create
│  URL is /join?   ────────┼──► join
│  URL is /game/*? ────────┼──► game
│  Otherwise       ────────┼──► home
└──────────────────────────┘

┌──────────────┐
│     home     │  ← Landing page
│              │
│  GO_TO_CREATE├──────────────► create
│  GO_TO_JOIN  ├──────────────► join
└──────────────┘

┌─────────────────────────────────────────────┐
│                  create                      │
│  ┌────────┐    ┌──────────┐    ┌─────────┐  │
│  │  idle  │───►│ creating │───►│ success │──┼──► game
│  │        │    │          │    └─────────┘  │
│  │        │    │ API call │                 │
│  │        │    │ in flight│───►┌─────────┐  │
│  │        │    └──────────┘   │ failure │  │
│  │        │                   │ RETRY──►│  │
│  └────────┘                   └─────────┘  │
│                                             │
│  Also has "creatingSystem" for AI games     │
│  GO_TO_HOME ────────────────────────► home  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│                   join                       │
│  ┌────────┐    ┌──────────┐    ┌─────────┐  │
│  │  idle  │───►│ joining  │───►│ success │──┼──► game
│  │        │    │          │    └─────────┘  │
│  │        │    │ API call │                 │
│  │        │    │ in flight│───►┌─────────┐  │
│  │        │    └──────────┘   │ failure │  │
│  │        │                   │ RETRY──►│  │
│  └────────┘                   └─────────┘  │
│  GO_TO_HOME ────────────────────────► home  │
└─────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                        game                               │
│  ┌──────┐    ┌─────────────┐                              │
│  │ idle │───►│ makingGuess │───► idle (on success)        │
│  │      │    │  (API call) │───► failure (on error)       │
│  │      │    └─────────────┘                              │
│  │      │                                                 │
│  │      │───►┌───────────────┐                            │
│  │      │    │fetchingStatus │───► idle                   │
│  │      │    └───────────────┘                            │
│  │      │                                                 │
│  │      │◄── GAME_DATA_CHANGED (Firebase real-time)      │
│  │      │    (updates gameData, playerRole, isMyTurn)     │
│  └──────┘                                                 │
│                                                           │
│  GO_TO_HOME ────────────────────────────────────► home    │
└──────────────────────────────────────────────────────────┘
```

---

## Machine Context (Global Data)

The machine's `context` is a JavaScript object that holds all shared data:

```javascript
context: {
  // --- Game data from server ---
  gameData: null,           // Full game state: players, turns, status, etc.
  gameId: null,             // e.g., "abc123"

  // --- Player identification ---
  playerInfo: null,         // { name: "Alice", fourDigit: "1234" }
  playerNum: null,          // "1" or "2"
  playerRole: null,         // "player1" or "player2"

  // --- Turn management ---
  isMyTurn: false,          // Is it this player's turn?
  player: null,             // Which player made the last guess

  // --- Guess data ---
  guess: null,              // Current guess being submitted
  correct_digits: null,     // How many right digits
  correct_positions: null,  // How many in right position

  // --- UI state ---
  loading: false,           // Show loading indicator?
  error: null,              // Error message to display

  // --- Game mode ---
  isSystemGame: false,      // Playing against AI?
}
```

---

## Events (Messages to the Machine)

Components send events to trigger state changes:

```javascript
// From HomePage — navigate to create page
send({ type: "GO_TO_CREATE" })
send({ type: "GO_TO_CREATE", isSystemGame: true })  // with payload
send({ type: "GO_TO_JOIN" })

// From CreateGamePage — create a new game
send({
  type: "CREATE_GAME",
  playerInfo: { name: "Alice", fourDigit: "1234" }
})

// From JoinGamePage — join existing game
send({
  type: "JOIN_GAME",
  gameId: "abc123",
  playerInfo: { name: "Bob", fourDigit: "5678" }
})

// From GamePage — make a guess
send({
  type: "MAKE_GUESS",
  guess: "5678",
  player: "player1"
})

// From Firebase listener — game data updated
send({ type: "GAME_DATA_CHANGED", data: { ...gameDataFromFirebase } })

// Navigation
send({ type: "GO_TO_HOME" })
```

---

## Actors (Async Operations)

When the machine enters states like "creating" or "makingGuess", it **invokes
an actor** — an async function that makes an API call:

```
┌────────────┐     invoke      ┌──────────────┐     fetch     ┌──────────┐
│  Machine   │ ──────────────► │    Actor     │ ────────────► │ Backend  │
│  (state:   │                 │  (actors.js) │               │  API     │
│  creating) │ ◄────────────── │              │ ◄──────────── │          │
│            │   onDone/Error  │              │   response    │          │
└────────────┘                 └──────────────┘               └──────────┘
```

**Actors in this project:**

| Actor              | Triggered by state  | API Endpoint              | Returns       |
|-------------------|--------------------|--------------------------:|---------------|
| createGame        | create.creating     | POST /create_game         | { game_id }   |
| createGameVsSystem| create.creatingSystem| POST /create_game_vs_system| { game_id }  |
| joinGame          | join.joining        | POST /join_game/:id       | game data     |
| makeGuess         | game.makingGuess    | POST /submit_guess/:id    | updated data  |
| getGameStatus     | game.fetchingStatus | GET /game_status/:id      | full status   |

---

## Actions (Side Effects on Transitions)

Actions run code when transitions happen. They update the context:

```javascript
// When CREATE_GAME event is sent:
assignCreateGame: assign(({ event }) => ({
  playerInfo: event.playerInfo,   // Save player info to context
  error: null,                     // Clear any previous errors
}))

// When game data changes from Firebase:
assignGameDataChanged: assign(({ context, event }) => {
  const gameData = event.data;
  // Figure out if I'm player1 or player2
  let playerRole = null;
  if (gameData.player1?.name === playerInfo.name) playerRole = "player1";
  // Figure out if it's my turn
  let isMyTurn = gameData.turn === playerRole;
  return { gameData, playerRole, isMyTurn };
})
```

---

## How State Machine Connects to React

```jsx
// App.jsx — The bridge between XState and React
function App() {
  const [state, send] = useMachine(gameMachine);
  //      │       │
  //      │       └── Function to send events
  //      └── Current state object

  // state.value     → "home" | "create" | "join" | "game"
  // state.context   → { gameData, gameId, playerRole, ... }
  // state.matches() → Check if in a specific state

  return <AppRoutes state={state} send={send} />;
}
```

**Reading machine state in components:**
```jsx
// GamePage.jsx
const { gameId, playerRole, isMyTurn, gameData } = state.context;

// Check sub-states:
if (state.matches("game.idle")) { ... }
```

---

## Complete Lifecycle Example: Making a Guess

```
1. Player types "5678" into pin inputs
   └── useState updates pin array: ["5", "6", "7", "8"]

2. Player clicks "Submit Guess"
   └── handleGuess() validates:
       ├── All 4 digits entered? ✓
       ├── All digits unique? ✓
       └── Not already guessed? ✓

3. Component sends event to machine:
   send({ type: "MAKE_GUESS", guess: "5678", player: "player1" })

4. Machine transitions: game.idle → game.makingGuess
   └── Actions: saves guess & player to context
   └── Entry action: sets loading = true

5. Machine invokes "makeGuess" actor:
   └── fetch("POST /submit_guess/abc123", { guess: "5678", player: "player1" })

6a. API responds with success:
    └── Machine: game.makingGuess → game.idle (onDone)
    └── Clears guess, loading from context

6b. API responds with error:
    └── Machine: game.makingGuess → game.failure (onError)
    └── Sets error message in context

7. Firebase triggers GAME_DATA_CHANGED event (real-time update)
   └── Machine updates gameData with new turn info
   └── isMyTurn becomes false (opponent's turn now)

8. Component re-renders with updated state
   └── Shows opponent's turn indicator
   └── Disables guess input
```
