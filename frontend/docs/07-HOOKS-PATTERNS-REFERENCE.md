# Hooks & Patterns Reference

## What are Hooks?

Hooks are special functions that let you "hook into" React features from
function components. They all start with `use`.

**Rules of Hooks:**
1. Only call hooks at the TOP level of your component (not inside if/for/etc.)
2. Only call hooks from React function components (not regular functions)

---

## Hooks Used in This Project

### 1. useState — "Remember a value"

```jsx
const [value, setValue] = useState(initialValue);
//     │        │                    │
//     │        │                    └── Starting value
//     │        └── Function to UPDATE the value
//     └── Current value (read-only)
```

**Every useState in the project:**

| Component      | State Variable   | Type              | Purpose                    |
|---------------|-----------------|-------------------|---------------------------|
| HomePage      | `hovered`        | `string`          | Which button is hovered   |
| CreateGame    | `playerName`     | `string`          | Name input value          |
| CreateGame    | `fourDigit`      | `string`          | Secret number input       |
| CreateGame    | `infoMsg`        | `string`          | Validation message        |
| JoinGame      | `gameId`         | `string`          | Game ID input (from URL)  |
| JoinGame      | `playerName`     | `string`          | Name input value          |
| JoinGame      | `fourDigit`      | `string`          | Secret number input       |
| JoinGame      | `infoMsg`        | `string`          | Validation message        |
| GamePage      | `pin`            | `string[4]`       | 4-digit guess input       |
| GamePage      | `isSubmitting`   | `boolean`         | API call in progress      |
| GamePage      | `copied`         | `boolean`         | Copy link feedback        |
| GamePage      | `guessError`     | `string`          | Guess validation error    |
| GamePage      | `timeLeft`       | `number`          | Countdown seconds         |
| ScratchPad    | `digitStatus`    | `(null\|string)[10]` | Digit tick/cross status |
| ScratchPad    | `grid`           | `boolean[4][4]`   | Position elimination      |

---

### 2. useEffect — "Do something after render"

```jsx
useEffect(() => {
  // This code runs AFTER the component renders

  return () => {
    // This CLEANUP code runs BEFORE the next effect or on unmount
  };
}, [dependency1, dependency2]);  // Only re-runs when these change
```

**Every useEffect in the project:**

| Component  | Dependencies         | Purpose                              | Has Cleanup? |
|-----------|---------------------|--------------------------------------|-------------|
| GamePage  | `[gameId, send]`    | Set up Firebase real-time listener   | Yes (unsubscribe) |
| GamePage  | `[gameData?.expireAt]`| Start countdown timer              | Yes (clearInterval) |
| GamePage  | `[state]`           | Reset isSubmitting when idle         | No          |
| ScratchPad| `[greenKey]`        | Reset grid when selected digits change| No         |
| AppRoutes | `[state, navigate]` | Sync URL with machine state          | No          |

---

### 3. useRef — "Persist a value without re-rendering"

```jsx
const myRef = useRef(initialValue);
// myRef.current = the value (mutable, no re-render on change)
```

**Every useRef in the project:**

| Component  | Ref Name      | Purpose                                |
|-----------|---------------|----------------------------------------|
| GamePage  | `pinRefs[0-3]`| Reference to 4 input DOM elements      |
| GamePage  | `expiredRef`  | Track if expiration was already handled |

**DOM ref usage:**
```jsx
<input ref={pinRefs[0]} />   // Attach ref to DOM element

pinRefs[1].current?.focus();  // Access DOM element → call focus()
```

---

### 4. useMachine (from @xstate/react) — "Use a state machine"

```jsx
const [state, send] = useMachine(gameMachine);
//     │       │                    │
//     │       │                    └── The machine definition
//     │       └── Function to send events to the machine
//     └── Current state (reactive — component re-renders when it changes)
```

**Used in:** App.jsx (once, at the top level)

**Reading state:**
```jsx
state.value              // "home" | "create" | "join" | "game"
state.context            // { gameData, gameId, playerRole, ... }
state.matches("home")    // true if in "home" state
state.matches("game.idle")  // true if in "game" → "idle" sub-state
```

---

### 5. useNavigate (from react-router-dom) — "Navigate programmatically"

```jsx
const navigate = useNavigate();
navigate("/create");           // Go to /create
navigate(-1);                  // Go back one page
```

**Used in:** AppRoutes component (App.jsx)

---

## Patterns Used in This Project

### Pattern 1: Event-Driven Architecture

Components don't directly manage complex logic. They send events to the
machine, and the machine handles everything:

```
Component                Machine               Backend
   │                       │                       │
   │ send("CREATE_GAME")   │                       │
   │──────────────────────►│                       │
   │                       │ fetch /create_game    │
   │                       │──────────────────────►│
   │                       │                       │
   │                       │◄──────────────────────│
   │                       │ response              │
   │                       │                       │
   │ re-render (context    │                       │
   │ changed)              │                       │
   │◄──────────────────────│                       │
```

**Benefit:** Components stay simple. All complex logic lives in the machine.

---

### Pattern 2: Lifting State Up

Instead of each component managing its own game data, ALL game state is
"lifted up" to the App component (via the machine) and passed down as props:

```
     App (owns machine) ──── Single Source of Truth
      │
      ├── HomePage       ← receives send
      ├── CreateGamePage ← receives send, state, loading, error
      ├── JoinGamePage   ← receives send
      └── GamePage       ← receives send, state
```

**Benefit:** No conflicting state between components.

---

### Pattern 3: Controlled Components (Forms)

Every form input's value is controlled by React state:

```jsx
<input
  value={playerName}                     // Controlled by state
  onChange={(e) => setPlayerName(e.target.value)}  // Updates state
/>
```

```
User types → onChange fires → setState → re-render → input shows new value
```

---

### Pattern 4: Callback Props (Child → Parent Communication)

When a child needs to send data UP to a parent, the parent passes a
callback function as a prop:

```jsx
// GamePage (parent)
<ScratchPad
  onFillGuess={(guess) => {            // Parent defines what to do
    setPin(guess.split(""));           // Update parent's state
    pinRefs[0].current?.focus();       // Focus first input
  }}
/>

// ScratchPad (child)
function ScratchPad({ onFillGuess }) {
  // When guess is ready:
  onFillGuess("1234");                  // Call parent's function
}
```

---

### Pattern 5: Derived State (Computed Values)

Instead of storing computed values in state, derive them from existing state:

```jsx
// DON'T store these in useState — compute them directly
const player1Name = gameData?.player1?.name || "Player 1";
const isFinished = gameData?.gameStatus === "finished";
const myTurns = playerRole === "player1" ? player1Turns : player2Turns;
const myColor = playerColors[playerRole] || playerColors.player1;
```

**Benefit:** No risk of state getting out of sync. Values are always
consistent with the source data.

---

### Pattern 6: Cleanup in useEffect

When useEffect creates subscriptions or timers, it returns a cleanup
function to prevent memory leaks:

```jsx
useEffect(() => {
  const unsubscribe = listenToGame(gameId, callback);
  return () => unsubscribe();  // ← Runs when component unmounts
}, [gameId]);

useEffect(() => {
  const interval = setInterval(updateTimer, 1000);
  return () => clearInterval(interval);  // ← Stops timer on unmount
}, [expireAt]);
```

---

### Pattern 7: Optional Chaining (?.)

Safely access nested properties that might be null/undefined:

```jsx
// Without optional chaining (crashes if gameData is null):
gameData.player1.name

// With optional chaining (returns undefined if any part is null):
gameData?.player1?.name
```

**Used extensively in GamePage:**
```jsx
const isSystemGame = gameData?.isSystemGame || false;
const player1Name = gameData?.player1?.name || "Player 1";
pinRefs[idx + 1].current?.focus();  // Don't crash if ref is null
```

---

### Pattern 8: Guard Clauses in useEffect

Early returns to skip effect logic when conditions aren't met:

```jsx
useEffect(() => {
  if (!gameData?.expireAt) return;  // ← Guard: skip if no data yet
  // ... rest of timer logic
}, [gameData?.expireAt]);
```

---

### Pattern 9: Index Files for Clean Imports

Each page folder has an `index.jsx` that re-exports the main component:

```jsx
// pages/Home/index.jsx
export { default } from "./HomePage";
```

This allows:
```jsx
// Clean import (looks for index.jsx automatically):
import HomePage from "./pages/Home";

// Instead of verbose:
import HomePage from "./pages/Home/HomePage";
```

---

### Pattern 10: State Cycling (ScratchPad)

Toggle through multiple states on click:

```jsx
const handleDigitClick = (idx) => {
  setDigitStatus((prev) => {
    const next = [...prev];
    // Cycle: null → "tick" → "cross" → null
    if (next[idx] === null) next[idx] = "tick";
    else if (next[idx] === "tick") next[idx] = "cross";
    else next[idx] = null;
    return next;
  });
};
```
