# Data Flow Guide

How data moves through the entire application, from user action to screen update.

---

## The Big Picture

```
┌─────────────┐   events    ┌─────────────┐   fetch    ┌─────────────┐
│   React     │ ──────────► │   XState    │ ─────────► │   Backend   │
│  Components │             │   Machine   │            │   API       │
│             │ ◄────────── │             │ ◄───────── │             │
│             │   context   │             │  response  │             │
└──────┬──────┘             └─────────────┘            └──────┬──────┘
       │                                                      │
       │    ┌─────────────────────────────────────────┐       │
       │    │           Firebase Firestore             │       │
       └────┤                                          ├───────┘
  listen    │  Real-time database                      │  writes
            │  Pushes updates to frontend instantly     │
            └──────────────────────────────────────────┘
```

---

## Flow 1: Creating a Game

```
USER                    REACT                   XSTATE                  BACKEND
 │                       │                       │                       │
 │ Types name + number   │                       │                       │
 │──────────────────────►│                       │                       │
 │                       │ setPlayerName("Ali")  │                       │
 │                       │ setFourDigit("1234")  │                       │
 │                       │  (local state)        │                       │
 │                       │                       │                       │
 │ Clicks "Create Game"  │                       │                       │
 │──────────────────────►│                       │                       │
 │                       │ send({                │                       │
 │                       │   type: "CREATE_GAME",│                       │
 │                       │   playerInfo: {...}   │                       │
 │                       │ })                    │                       │
 │                       │──────────────────────►│                       │
 │                       │                       │ State: idle→creating  │
 │                       │                       │ saves playerInfo      │
 │                       │                       │ loading = true        │
 │                       │                       │                       │
 │                       │ re-renders with       │ invokes createGame    │
 │                       │ loading=true          │ actor                 │
 │                       │ shows "Creating..."   │──────────────────────►│
 │                       │                       │ POST /create_game     │
 │                       │                       │                       │
 │                       │                       │ response: {game_id}   │
 │                       │                       │◄──────────────────────│
 │                       │                       │                       │
 │                       │                       │ State: creating→success│
 │                       │                       │ → then auto → game   │
 │                       │                       │ gameId = "abc123"    │
 │                       │                       │ loading = false      │
 │                       │                       │                       │
 │                       │ useEffect sees state  │                       │
 │                       │ matches "game"        │                       │
 │                       │ navigate("/game/abc123/1")                    │
 │                       │                       │                       │
 │ Sees game page        │                       │                       │
 │◄──────────────────────│                       │                       │
```

---

## Flow 2: Real-Time Game Updates

```
PLAYER A's BROWSER              FIREBASE                PLAYER B's BROWSER
       │                           │                           │
       │ Makes a guess             │                           │
       │ → API call                │                           │
       │ → Backend updates ────────┤                           │
       │   Firestore               │                           │
       │                           │                           │
       │                           │ onSnapshot fires          │
       │                           │──────────────────────────►│
       │                           │ data: { turn: "player2",  │
       │                           │   player1Turns: [...] }   │
       │                           │                           │
       │ onSnapshot fires          │                           │
       │◄──────────────────────────│                           │
       │ data: same new data       │                           │
       │                           │                           │
       │ send({                    │               send({      │
       │   type: "GAME_DATA_CHANGED"│               type: "GAME_DATA_CHANGED"
       │   data: {...}             │               data: {...} │
       │ })                        │             })            │
       │                           │                           │
       │ Machine updates context:  │             Machine updates:
       │   isMyTurn = false        │               isMyTurn = true
       │   gameData = {...}        │               gameData = {...}
       │                           │                           │
       │ UI: "Waiting for          │             UI: "Your Turn!"
       │      opponent..."         │                           │
```

---

## Flow 3: Data Inside a Component (GamePage)

```
GamePage Component
│
├── FROM PROPS (state machine context)
│   │
│   ├── state.context.gameId ──────────► Used in API calls
│   ├── state.context.gameData ────────► Displayed: turns, scores, names
│   ├── state.context.playerRole ──────► Determines "You" vs "Opponent"
│   └── state.context.isMyTurn ────────► Enables/disables guess form
│
├── FROM LOCAL STATE (useState)
│   │
│   ├── pin["", "", "", ""] ───────────► 4 input fields for guess
│   ├── isSubmitting ──────────────────► "Submitting..." button text
│   ├── copied ────────────────────────► "Copied!" feedback
│   ├── guessError ────────────────────► "Digits must be unique" msg
│   └── timeLeft ──────────────────────► Countdown timer display
│
├── FROM DERIVED VALUES (computed from state)
│   │
│   ├── player1Name = gameData?.player1?.name ─► Displayed
│   ├── player1Turns = gameData?.player1Turns ─► Guess history list
│   ├── isFinished = gameStatus === "finished" ► Winner banner
│   ├── winnerName ────────────────────────────► "Alice won!"
│   └── myColor = playerColors[playerRole] ────► Blue or Green theme
│
└── FROM SIDE EFFECTS (useEffect)
    │
    ├── listenToGame() ────► Firestore subscription (real-time)
    ├── setInterval() ─────► Timer countdown every second
    └── state.matches() ───► Reset isSubmitting when back to idle
```

---

## How Props Flow Down the Tree

```
                        App.jsx
                    [state, send] = useMachine(gameMachine)
                          │
                          │ passes state & send
                          ▼
                      AppRoutes
                          │
            ┌─────────────┼─────────────────┐──────────────┐
            │             │                 │              │
            ▼             ▼                 ▼              ▼
        HomePage      CreateGame        JoinGame       GamePage
        ┌──────┐      ┌──────────┐     ┌────────┐    ┌────────┐
        │ send │      │ send     │     │ send   │    │ send   │
        │      │      │ state    │     │        │    │ state  │
        │      │      │ loading  │     │        │    │        │
        │      │      │ error    │     │        │    │        │
        └──────┘      └──────────┘     └────────┘    └───┬────┘
                                                         │
                                                         │ onFillGuess
                                                         ▼
                                                    ScratchPad
                                                    ┌──────────┐
                                                    │onFillGuess│
                                                    └──────────┘
```

---

## Data Sources Summary

| Data                      | Source              | Where it lives        | Who reads it        |
|--------------------------|---------------------|----------------------|---------------------|
| Game ID                  | Backend API         | Machine context      | GamePage, URL       |
| Player names             | User input → API    | Machine context      | GamePage            |
| Guess history            | Firebase realtime   | Machine context      | GamePage            |
| Current turn             | Firebase realtime   | Machine context      | GamePage            |
| Loading/Error flags      | Machine transitions | Machine context      | CreateGame, JoinGame|
| Pin input digits         | User typing         | Local useState       | GamePage            |
| Hover state              | Mouse events        | Local useState       | HomePage            |
| Timer countdown          | Computed from data  | Local useState       | GamePage            |
| Digit elimination        | User clicks         | Local useState       | ScratchPad          |
| Form validation errors   | Computed locally    | Local useState       | CreateGame, JoinGame, GamePage |
