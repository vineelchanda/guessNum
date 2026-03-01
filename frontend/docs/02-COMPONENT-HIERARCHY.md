# Component Hierarchy & Tree

## What is a Component?

In React, a **component** is a reusable piece of UI. Think of it like a LEGO
brick — you build your app by snapping components together. Each component
is a JavaScript function that returns HTML-like code (called JSX).

---

## The Full Component Tree

```
<BrowserRouter>                          ← from react-router-dom (in main.jsx)
│                                          Enables URL-based navigation
│
└── <App>                                ← Root component (App.jsx)
    │  Creates state machine: [state, send] = useMachine(gameMachine)
    │
    └── <AppRoutes state={state} send={send}>    ← Inner component
        │  Uses useNavigate() to sync URL with machine state
        │  Uses useEffect() to navigate when state changes
        │
        └── <Routes>                     ← React Router container
            │
            ├── Route "/"
            │   └── <HomePage send={send}>
            │       │  Local state: hovered (which button is hovered)
            │       │  Sends: GO_TO_CREATE, GO_TO_JOIN
            │       │
            │       └── 3x Card buttons (Create / Play vs System / Join)
            │
            ├── Route "/create"
            │   └── <CreateGamePage send={send} state={state}
            │   │                   loading={...} error={...}>
            │   │  Local state: playerName, fourDigit, infoMsg
            │   │  Sends: CREATE_GAME, GO_TO_HOME
            │   │
            │   └── Form with inputs + submit button
            │
            ├── Route "/join"
            │   └── <JoinGamePage send={send}>
            │       │  Local state: gameId, playerName, fourDigit, infoMsg
            │       │  Sends: JOIN_GAME, GO_TO_HOME
            │       │
            │       └── Form with inputs + submit button
            │
            └── Route "/game/:gameId/:playerNum?"
                └── <GamePage send={send} state={state}>
                    │  Local state: pin[4], isSubmitting, copied,
                    │               guessError, timeLeft
                    │  Uses: listenToGame() for real-time Firestore updates
                    │  Sends: GAME_DATA_CHANGED, MAKE_GUESS, GO_TO_HOME
                    │
                    ├── Game ID display + Copy Invite Link button
                    ├── <ScratchPad onFillGuess={...}>
                    │   │  Local state: digitStatus[10], grid[4][4]
                    │   │  Self-contained helper component
                    │   └── Digit buttons + Position elimination grid
                    ├── Waiting message (if waiting for player 2)
                    ├── Winner/Loser banner (if game finished)
                    ├── Left panel:  Your info + your guesses
                    ├── Center panel: Turn indicator + guess form + timer
                    └── Right panel: Opponent info + their guesses
```

---

## Component Relationships Diagram

```
                    ┌──────────┐
                    │   App    │
                    │          │
                    │ owns the │
                    │  state   │
                    │ machine  │
                    └────┬─────┘
                         │
                         │  passes state & send as props
                         │
                  ┌──────┴──────┐
                  │  AppRoutes  │
                  │             │
                  │ syncs URL ↔ │
                  │ machine     │
                  │ state       │
                  └──────┬──────┘
                         │
           ┌─────────────┼─────────────┐────────────┐
           │             │             │             │
     ┌─────┴────┐  ┌─────┴────┐  ┌────┴─────┐  ┌───┴─────┐
     │ HomePage │  │CreateGame│  │ JoinGame │  │GamePage │
     │          │  │  Page    │  │  Page    │  │         │
     │ 3 cards  │  │ form    │  │ form     │  │ complex │
     │ buttons  │  │ inputs  │  │ inputs   │  │ game UI │
     └──────────┘  └─────────┘  └──────────┘  └────┬────┘
                                                    │
                                              ┌─────┴─────┐
                                              │ScratchPad │
                                              │           │
                                              │ digit     │
                                              │ tracker   │
                                              └───────────┘
```

---

## Props Flow (How Data Moves Between Components)

```
App (OWNER of state machine)
 │
 │─── state ──────────► AppRoutes ──► All Pages
 │─── send  ──────────► AppRoutes ──► All Pages
 │
 │  "state" = current state of the machine (which page, game data, etc.)
 │  "send"  = function to trigger events (like "CREATE_GAME")
 │
 │  Think of it like:
 │    state = "what's happening right now"
 │    send  = "make something happen"
```

### What Each Component Receives:

| Component      | Props Received                  | What it does with them            |
|----------------|--------------------------------|-----------------------------------|
| HomePage       | `send`                         | Calls `send({type: "GO_TO_CREATE"})` etc. |
| CreateGamePage | `send, state, loading, error`  | Reads loading/error to show UI state, calls `send({type: "CREATE_GAME", ...})` |
| JoinGamePage   | `send`                         | Calls `send({type: "JOIN_GAME", ...})` |
| GamePage       | `send, state`                  | Reads `state.context` for game data, calls `send` for guesses |
| ScratchPad     | `onFillGuess`                  | Calls `onFillGuess("1234")` when guess is ready |

---

## React Concept: Parent → Child Communication

```
PARENT (has data)
   │
   │  <Child name="Alice" age={25} />    ← Passes data as "props"
   │
   ▼
CHILD (receives props)
   function Child({ name, age }) {       ← Destructures props
     return <h1>Hello {name}, age {age}</h1>
   }
```

In this project:
- `App` is the parent that owns the state machine
- All pages are children that receive `state` and `send` as props
- `GamePage` is a parent to `ScratchPad`, passing `onFillGuess` callback
