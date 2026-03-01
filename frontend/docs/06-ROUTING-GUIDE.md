# Routing & Navigation Guide

## What is Routing?

In a traditional website, clicking a link loads a NEW page from the server.
In a **Single Page Application (SPA)** like this one, there's only ONE HTML
page. React Router changes what's shown on screen by swapping components —
the URL changes but the page never reloads.

---

## How React Router is Set Up

### Step 1: Wrap the app in BrowserRouter (main.jsx)

```jsx
// main.jsx
import { BrowserRouter as Router } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Router>          {/* ← Enables routing for everything inside */}
    <App />
  </Router>
);
```

### Step 2: Define Routes (App.jsx)

```jsx
// App.jsx
import { Routes, Route } from "react-router-dom";

<Routes>
  <Route path="/"                      element={<HomePage />} />
  <Route path="/create"                element={<CreateGamePage />} />
  <Route path="/join"                  element={<JoinGamePage />} />
  <Route path="/game/:gameId/:playerNum?" element={<GamePage />} />
</Routes>
```

---

## Route Patterns Explained

```
Pattern                         Example URL            Matches?
──────────────────────────────────────────────────────────────────
"/"                             /                       ✓
"/create"                       /create                 ✓
"/join"                         /join                   ✓
"/game/:gameId/:playerNum?"     /game/abc123            ✓ (playerNum = undefined)
"/game/:gameId/:playerNum?"     /game/abc123/1          ✓ (playerNum = "1")
"/game/:gameId/:playerNum?"     /game/abc123/2          ✓ (playerNum = "2")
```

### URL Parameters:
- `:gameId` — **Dynamic segment**. Captures whatever text is in that position.
  `/game/abc123` → gameId = "abc123"
- `:playerNum?` — The `?` makes it **optional**.
  `/game/abc123` → playerNum = undefined
  `/game/abc123/1` → playerNum = "1"

---

## Navigation in This Project

This project has a **unique navigation pattern** — the XState machine controls
which page is shown, and React Router follows along.

```
Normal React Router:     URL changes → component changes
This project:            Machine state changes → URL changes → component changes
```

### The Navigation Sync (App.jsx)

```jsx
function AppRoutes({ state, send }) {
  const navigate = useNavigate();  // ← Hook that gives navigation function

  React.useEffect(() => {
    // When machine state changes, update the URL to match
    if (state.matches("home"))   navigate("/");
    if (state.matches("create")) navigate("/create");
    if (state.matches("join"))   navigate("/join");
    if (state.matches("game") && state.context.gameId) {
      navigate(`/game/${state.context.gameId}/${playerNum}`);
    }
  }, [state, navigate]);

  return <Routes>...</Routes>;
}
```

### How Navigation Works Step by Step:

```
1. User clicks "Create Game" button on HomePage
   │
2. Component calls: send({ type: "GO_TO_CREATE" })
   │
3. Machine transitions from "home" state to "create" state
   │
4. React re-renders (state changed)
   │
5. useEffect in AppRoutes fires:
   │  state.matches("create") is now true
   │  → calls navigate("/create")
   │
6. React Router shows CreateGamePage component
   │
7. URL bar shows: localhost:5173/create
```

---

## Route Diagram

```
                    ┌──────────────────────┐
                    │    Browser URL Bar    │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │    React Router      │
                    │    <Routes>          │
                    └──────────┬───────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
    ┌────▼────┐          ┌─────▼─────┐         ┌────▼──────┐
    │   "/"   │          │ "/create" │         │  "/join"  │
    │         │          │ "/join"   │         │           │
    │HomePage │          │CreateGame │         │ JoinGame  │
    └─────────┘          └───────────┘         └───────────┘
                                                     │
                                          ┌──────────▼──────────┐
                                          │ "/game/:gameId/:p?" │
                                          │                     │
                                          │     GamePage        │
                                          └─────────────────────┘
```

---

## Reading URL Parameters

### From URL Path (dynamic segments)
```jsx
// The machine reads path params manually from window.location
const match = window.location.pathname.match(/\/game\/(\w+)(?:\/(\d))?/);
// match[1] = gameId, match[2] = playerNum
```

### From URL Query String
```jsx
// JoinGame.jsx — reads ?gameId=abc123 from URL
const [gameId, setGameId] = useState(() => {
  const params = new URLSearchParams(window.location.search);
  return params.get("gameId") || "";  // "abc123"
});
```

This is used when someone shares an invite link like:
`https://guessnum.com/join?gameId=abc123`

---

## Programmatic Navigation

```jsx
// Using useNavigate hook
const navigate = useNavigate();
navigate("/create");                    // Go to /create
navigate(`/game/${gameId}/1`);         // Go to game with params
navigate("/");                          // Go to home

// Using window.history (done in machine for redirects)
window.history.replaceState({}, "", `/game/${gameId}/1`);
// Changes URL without adding to browser history
```

---

## Key React Router Concepts Used

| Concept           | Where                     | What it does                    |
|-------------------|---------------------------|---------------------------------|
| `<BrowserRouter>` | main.jsx                  | Wraps app, enables routing      |
| `<Routes>`        | App.jsx                   | Container for Route definitions |
| `<Route>`         | App.jsx                   | Maps URL path → component       |
| `useNavigate()`   | App.jsx (AppRoutes)       | Programmatic navigation         |
| `:param`          | "/game/:gameId/:playerNum?"| URL parameters                  |
| `?` suffix        | ":playerNum?"             | Makes param optional            |
