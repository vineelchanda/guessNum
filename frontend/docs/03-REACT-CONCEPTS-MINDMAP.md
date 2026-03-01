# React Concepts Mindmap

Every React concept used in this project, explained with the exact line of code
where it appears.

---

## Visual Mindmap

```
                        ┌──────────────────────┐
                        │   REACT CONCEPTS     │
                        │   IN GUESSNUM        │
                        └──────────┬───────────┘
                                   │
        ┌──────────────┬───────────┼───────────┬──────────────┐
        │              │           │           │              │
   ┌────┴────┐   ┌─────┴────┐ ┌───┴───┐ ┌─────┴────┐  ┌─────┴──────┐
   │  JSX    │   │  Hooks   │ │ Props │ │  State   │  │  Patterns  │
   │         │   │          │ │       │ │ Mgmt     │  │            │
   └────┬────┘   └────┬─────┘ └───┬───┘ └─────┬───┘  └─────┬──────┘
        │              │           │           │            │
   HTML-in-JS     useState      Parent→     XState      Conditional
   {} expressions useEffect     Child      Machine      Rendering
   map() lists    useRef       Callbacks   Context      Event
   Conditional    useMachine   Destructure              Handling
   Rendering      useNavigate                           Forms
                                                        CSS-in-JS
```

---

## 1. JSX (JavaScript XML)

**What:** HTML-like syntax inside JavaScript. React's way of describing UI.

**Where in project:**
```jsx
// HomePage.jsx — JSX looks like HTML but it's JavaScript
<div className={styles.homePage}>
  <h1 className={styles.heading}>Welcome to GuessNum!</h1>
  <button onClick={() => send({ type: "GO_TO_CREATE" })}>
    Create Game
  </button>
</div>
```

**Key rules:**
- Use `className` instead of `class` (class is reserved in JS)
- Use `{}` to embed JavaScript expressions: `{player1Name}`
- Every tag must be closed: `<input />` not `<input>`
- Return a single root element (or use `<>...</>` fragment)

---

## 2. Components (Function Components)

**What:** Functions that return JSX. Each component = one piece of UI.

**Where in project:**
```jsx
// Every page is a function component
function HomePage({ send }) {      // ← Function component
  return (                          // ← Returns JSX
    <div>...</div>
  );
}
export default HomePage;            // ← Exported so others can import it
```

**Your project has these components:**
| Component      | File                        | Purpose                    |
|---------------|-----------------------------|----------------------------|
| App           | `src/App.jsx`               | Root, owns state machine   |
| AppRoutes     | `src/App.jsx`               | Syncs URL ↔ state          |
| HomePage      | `pages/Home/HomePage.jsx`   | Landing page               |
| CreateGamePage| `pages/CreateGame/CreateGame.jsx` | Create game form    |
| JoinGamePage  | `pages/JoinGame/JoinGame.jsx`     | Join game form      |
| GamePage      | `pages/Game/Game.jsx`       | Main game screen           |
| ScratchPad    | `pages/Game/ScratchPad.jsx` | Digit helper tool          |

---

## 3. Props (Properties)

**What:** Data passed from parent to child component. Like function arguments.

**Where in project:**
```jsx
// App.jsx passes props to pages
<HomePage send={send} state={state} />

// HomePage.jsx receives and uses them
function HomePage({ send }) {  // ← Destructuring props
  send({ type: "GO_TO_CREATE" })  // ← Using the prop
}
```

**Types of props in this project:**
- **Data props:** `state`, `loading`, `error` — read-only data to display
- **Callback props:** `send`, `onFillGuess` — functions the child can call
- **Mixed:** `state` contains both data (`state.context.gameData`) and
  methods (`state.matches("home")`)

---

## 4. useState Hook

**What:** Gives a component its own private data that can change over time.
When state changes, the component re-renders (re-draws on screen).

**Where in project:**
```jsx
// CreateGame.jsx
const [playerName, setPlayerName] = useState("");   // Initial value: ""
const [fourDigit, setFourDigit] = useState("");
const [infoMsg, setInfoMsg] = useState("");

// To update:
setPlayerName("Alice");  // Component re-renders with new value
```

```jsx
// Game.jsx — multiple state values
const [pin, setPin] = useState(["", "", "", ""]);     // Array of 4 strings
const [isSubmitting, setIsSubmitting] = useState(false); // Boolean
const [copied, setCopied] = useState(false);
const [guessError, setGuessError] = useState("");
const [timeLeft, setTimeLeft] = useState(0);            // Number
```

```jsx
// ScratchPad.jsx — complex state
const [digitStatus, setDigitStatus] = useState(Array(10).fill(null));
// [null, null, null, null, null, null, null, null, null, null]
// Each can be: null | "tick" | "cross"
```

**Pattern — useState with function initializer:**
```jsx
// JoinGame.jsx — reads URL param on first render only
const [gameId, setGameId] = useState(() => {
  const params = new URLSearchParams(window.location.search);
  return params.get("gameId") || "";
});
// The function runs ONCE on mount, not on every render
```

---

## 5. useEffect Hook

**What:** Runs code AFTER the component renders. Used for:
- Fetching data
- Setting up subscriptions
- Timers
- Any "side effect" (something that reaches outside the component)

**Where in project:**

### 5a. Real-time listener (run once on mount)
```jsx
// Game.jsx:24-31
useEffect(() => {
  const unsubscribe = listenToGame(gameId, (data) => {
    send({ type: "GAME_DATA_CHANGED", data });
  });
  return () => unsubscribe();  // ← CLEANUP: runs when component unmounts
}, [gameId, send]);            // ← DEPENDENCY ARRAY: re-runs if these change
```

### 5b. Timer (re-runs when expireAt changes)
```jsx
// Game.jsx:34-55
useEffect(() => {
  if (!gameData?.expireAt) return;  // ← Guard clause: skip if no data
  const interval = setInterval(updateTimer, 1000);
  return () => clearInterval(interval);  // ← CLEANUP: stop timer
}, [gameData?.expireAt]);
```

### 5c. Sync with external state
```jsx
// Game.jsx:58-62
useEffect(() => {
  if (state.matches("game.idle")) {
    setIsSubmitting(false);  // Reset flag when machine returns to idle
  }
}, [state]);  // ← Re-runs whenever machine state changes
```

### 5d. Reset grid when digits change (ScratchPad)
```jsx
// ScratchPad.jsx:20-26
useEffect(() => {
  if (greenDigits.length === 4) {
    setGrid(Array(4).fill(null).map(() => Array(4).fill(true)));
  } else {
    setGrid(null);
  }
}, [greenKey]);  // ← greenKey = "2,5,7,9" string (changes when digits change)
```

**useEffect dependency array explained:**
```
useEffect(() => { ... }, []);        // [] = run ONCE on mount
useEffect(() => { ... }, [x, y]);    // [x,y] = run when x or y changes
useEffect(() => { ... });            // no array = run on EVERY render (avoid!)
```

---

## 6. useRef Hook

**What:** Creates a mutable reference that persists across renders WITHOUT
triggering re-renders. Commonly used to reference DOM elements directly.

**Where in project:**
```jsx
// Game.jsx:11-16 — refs to input elements for focus management
const pinRefs = [
  React.useRef(),
  React.useRef(),
  React.useRef(),
  React.useRef(),
];

// Usage: focus the next input after typing a digit
if (val && idx < 3) {
  pinRefs[idx + 1].current?.focus();  // ← .current gives the DOM element
}
```

```jsx
// Game.jsx:20 — ref to track if expiration was already handled
const expiredRef = useRef(false);

// Used to prevent double-firing
if (diff === 0 && !expiredRef.current) {
  expiredRef.current = true;   // ← Does NOT trigger re-render
  fetch(ENDPOINTS.EXPIRE_GAME(gameId), { method: "POST" });
}
```

**useState vs useRef:**
```
useState  → triggers re-render when changed → for UI-visible data
useRef    → does NOT trigger re-render     → for behind-the-scenes values
```

---

## 7. Event Handling

**What:** Responding to user interactions (clicks, typing, form submissions).

**Where in project:**
```jsx
// Click handler
<button onClick={() => send({ type: "GO_TO_CREATE" })}>

// Form submit handler (with e.preventDefault() to stop page reload)
<form onSubmit={handleGuess}>

// Input change handler
<input onChange={(e) => setPlayerName(e.target.value)} />

// Keyboard handler
<input onKeyDown={(e) => handlePinKeyDown(idx, e)} />

// Mouse hover handlers
<button
  onMouseEnter={() => setHovered("create")}
  onMouseLeave={() => setHovered("")}
>
```

**The "e" parameter:**
```jsx
function handleGuess(e) {
  e.preventDefault();  // ← Stops the browser's default form submission
  // ... your logic
}
```

---

## 8. Conditional Rendering

**What:** Show different UI based on conditions. React's version of "if/else"
in HTML.

**Where in project:**

### 8a. && operator (show if true)
```jsx
// Game.jsx — Only show error if there IS an error
{guessError && (
  <div style={{ color: "#e53935" }}>{guessError}</div>
)}

// Only show "Your Turn!" badge if it IS my turn
{isMyTurn && (
  <span>Your Turn!</span>
)}
```

### 8b. Ternary operator (if/else)
```jsx
// Game.jsx — Show different text based on condition
{isSubmitting ? "Submitting..." : "Submit Guess"}

// Different background based on who won
background: winnerRole === playerRole
  ? "linear-gradient(90deg, #43e97b, #38f9d7)"   // You won (green)
  : "linear-gradient(90deg, #e57373, #ffb199)"    // You lost (red)
```

### 8c. Chained ternaries
```jsx
// Game.jsx — Multiple conditions
{turn === "player1"
  ? `${player1Name} (Player 1)`
  : turn === "player2"
  ? `${player2Name} (Player 2)`
  : "-"}
```

---

## 9. List Rendering with map()

**What:** Render an array of items as a list of JSX elements.

**Where in project:**
```jsx
// Game.jsx — Render guess history
{player1Turns.map((turn, idx) => (
  <li key={idx}>              {/* key= is required for React */}
    {renderGuess(turn.guess)}
    <span>(Correct digits: {turn.correct_digits})</span>
  </li>
))}

// ScratchPad.jsx — Render digit buttons
{digitStatus.map((status, idx) => (
  <button key={idx} onClick={() => handleDigitClick(idx)}>
    {idx}
  </button>
))}

// Game.jsx — Render pin input fields
{pin.map((digit, idx) => (
  <input key={idx} ref={pinRefs[idx]} value={digit} ... />
))}
```

**Why `key=`?** React needs a unique key for each item in a list so it knows
which items changed, were added, or were removed.

---

## 10. Forms & Controlled Components

**What:** In React, form inputs are "controlled" — their value comes from state,
and changes go through state.

**Where in project:**
```jsx
// CreateGame.jsx — Controlled input
<input
  value={playerName}                          // Value FROM state
  onChange={(e) => setPlayerName(e.target.value)}  // Update state on change
/>

// The cycle:
// 1. User types "A"
// 2. onChange fires → setPlayerName("A")
// 3. Component re-renders → input shows "A"
```

**Input validation while typing:**
```jsx
// CreateGame.jsx — Only allow unique digits
onChange={(e) => {
  let val = e.target.value.replace(/[^\d]/g, "");  // Strip non-digits
  let unique = "";
  for (let ch of val) {
    if (!unique.includes(ch) && unique.length < 4) unique += ch;
  }
  setFourDigit(unique);
}}
```

---

## 11. CSS Approaches Used

This project uses THREE different styling approaches:

### 11a. Inline Styles (most common in this project)
```jsx
// Game.jsx, CreateGame.jsx, JoinGame.jsx
<div style={{
  minHeight: "100vh",
  display: "flex",
  background: "linear-gradient(135deg, #fffbe7 0%, #ffe066 100%)",
}}>
```
- Styles are JavaScript objects
- Use `camelCase` not `kebab-case`: `backgroundColor` not `background-color`
- Values are strings: `"100vh"` not `100vh`
- Numbers without units are pixels: `padding: 16` = `padding: 16px`

### 11b. CSS Modules (HomePage only)
```jsx
// HomePage.jsx
import styles from "./HomePage.module.css";
<div className={styles.homePage}>     // ← styles.homePage = unique class name
<h1 className={styles.heading}>       // ← Scoped: won't conflict with others
```
- Import CSS file as an object
- Each class name becomes a unique auto-generated name
- Prevents CSS conflicts between components

### 11c. Regular CSS (ScratchPad)
```jsx
// ScratchPad.jsx
import "./ScratchPad.css";
<div className="scratchpad-container">  // ← Regular string class name
```
- Traditional CSS file, imported globally
- Class names are NOT scoped (can conflict)

### 11d. Tailwind CSS (available but barely used)
```css
/* index.css */
@import "tailwindcss";
```
- Installed and configured but most components use inline styles instead

---

## 12. Import/Export Patterns

### Default Export (one thing per file)
```jsx
// HomePage.jsx
export default HomePage;

// Importing:
import HomePage from "./pages/Home";
```

### Named Export (multiple things per file)
```jsx
// actions.js
export const actions = { ... };
export const entryActions = { ... };

// Importing:
import { actions, entryActions } from "./actions";
```

### Re-export Pattern (index.jsx files)
```jsx
// pages/Home/index.jsx
export { default } from "./HomePage";

// This lets you write cleaner imports:
import HomePage from "./pages/Home";     // ← imports from index.jsx
// Instead of:
import HomePage from "./pages/Home/HomePage";
```

---

## Concept Checklist

| Concept                    | Used In                    | Learned? |
|---------------------------|----------------------------|----------|
| JSX                       | Every component            | [ ]      |
| Function Components       | Every file in pages/       | [ ]      |
| Props                     | All pages receive send/state| [ ]     |
| useState                  | All pages + ScratchPad     | [ ]      |
| useEffect                 | Game.jsx, ScratchPad.jsx   | [ ]      |
| useRef                    | Game.jsx (pin inputs)      | [ ]      |
| Event Handling             | Click, Submit, KeyDown     | [ ]      |
| Conditional Rendering     | Game.jsx (&&, ternary)     | [ ]      |
| List Rendering (map)      | Game.jsx, ScratchPad.jsx   | [ ]      |
| Controlled Forms          | CreateGame, JoinGame       | [ ]      |
| CSS Modules               | HomePage                   | [ ]      |
| Inline Styles             | CreateGame, JoinGame, Game | [ ]      |
| Import/Export              | Every file                 | [ ]      |
| Cleanup in useEffect      | Game.jsx (unsubscribe)     | [ ]      |
| Callback Props            | ScratchPad (onFillGuess)   | [ ]      |
