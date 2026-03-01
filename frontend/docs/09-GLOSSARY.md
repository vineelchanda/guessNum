# Glossary — Every Term You'll Encounter

Quick-reference for all technical terms used in this project.

---

## React Terms

| Term                    | Definition                                                 |
|------------------------|-----------------------------------------------------------|
| **Component**          | A function that returns UI (JSX). The building block of React apps. |
| **JSX**                | HTML-like syntax inside JavaScript. `<div>Hello</div>` is JSX. |
| **Props**              | Data passed from parent to child component. Read-only. |
| **State (useState)**   | Component's private memory. Changes trigger re-renders. |
| **Hook**               | Special function starting with `use`. Adds features to components. |
| **useEffect**          | Hook to run code after render (side effects). |
| **useRef**             | Hook for mutable reference that doesn't trigger re-renders. |
| **Re-render**          | When React re-runs a component to update the UI. |
| **Mount**              | When a component appears on screen for the first time. |
| **Unmount**            | When a component is removed from the screen. |
| **Cleanup**            | Code in useEffect's return function. Runs on unmount. |
| **Controlled Input**   | Form input whose value is controlled by React state. |
| **Conditional Render** | Showing/hiding UI based on conditions (`&&`, `?:`). |
| **Key (key=)**         | Unique identifier React needs for items in a list. |
| **Fragment (<>...</>)** | Invisible wrapper to return multiple elements. |
| **Virtual DOM**        | React's in-memory copy of the real DOM. Enables fast updates. |

---

## React Router Terms

| Term                | Definition                                               |
|--------------------|----------------------------------------------------------|
| **SPA**            | Single Page Application. One HTML file, React swaps content. |
| **BrowserRouter**  | Component that enables URL-based routing. |
| **Route**          | Maps a URL pattern to a component. |
| **Routes**         | Container for Route components. |
| **useNavigate**    | Hook that returns a function to change URLs programmatically. |
| **Dynamic Segment**| URL part starting with `:`. E.g., `:gameId` captures the value. |
| **Query String**   | URL parameters after `?`. E.g., `?gameId=abc123`. |

---

## XState Terms

| Term              | Definition                                                 |
|------------------|-----------------------------------------------------------|
| **State Machine** | A model with defined states and transitions between them. |
| **State**        | The current "mode" of the machine (e.g., "home", "game"). |
| **Event**        | A message sent to the machine to trigger a transition. |
| **Transition**   | Moving from one state to another in response to an event. |
| **Context**      | The machine's data storage (like component state but global). |
| **Action**       | Code that runs during a transition (e.g., updating context). |
| **Actor**        | An async operation invoked by the machine (API calls). |
| **Guard**        | A condition that must be true for a transition to happen. |
| **Entry Action** | Action that runs when ENTERING a state. |
| **invoke**       | Start an async actor when entering a state. |
| **onDone**       | Transition to take when an invoked actor succeeds. |
| **onError**      | Transition to take when an invoked actor fails. |
| **always**       | Automatic transition (happens immediately, no event needed). |
| **assign()**     | XState function to update context values. |
| **fromPromise()** | Wraps an async function as an XState actor. |
| **useMachine()** | React hook that creates and runs a state machine. |

---

## Firebase/Firestore Terms

| Term              | Definition                                               |
|------------------|----------------------------------------------------------|
| **Firebase**     | Google's app development platform. |
| **Firestore**    | Firebase's NoSQL cloud database. |
| **Document**     | A single record in Firestore (like a row in a table). |
| **Collection**   | A group of documents (like a table). |
| **onSnapshot**   | Firestore listener that fires when a document changes. |
| **Real-time**    | Updates pushed instantly without polling/refreshing. |

---

## Build Tool Terms

| Term              | Definition                                               |
|------------------|----------------------------------------------------------|
| **Vite**         | Fast build tool and dev server for modern web apps. |
| **Dev Server**   | Local server for development with hot reload. |
| **Hot Reload**   | Instant page update when you save code changes. |
| **Bundle**       | Combined JavaScript file for production. |
| **Plugin**       | Extension for Vite (React plugin, Tailwind plugin). |

---

## CSS Terms

| Term              | Definition                                               |
|------------------|----------------------------------------------------------|
| **Tailwind CSS** | Utility-first CSS framework. Classes like `flex`, `p-4`. |
| **CSS Modules**  | CSS file where class names are scoped to one component. |
| **Inline Styles**| Styles written as JavaScript objects in JSX. |
| **Media Query**  | CSS that applies only at certain screen sizes. |
| **Responsive**   | Design that adapts to different screen sizes. |

---

## JavaScript Terms

| Term                    | Definition                                         |
|------------------------|---------------------------------------------------|
| **Arrow Function**     | `(x) => x * 2`. Short function syntax. |
| **Destructuring**      | `const { name, age } = person`. Extract values. |
| **Template Literal**   | `` `Hello ${name}` ``. String with embedded expressions. |
| **Optional Chaining**  | `obj?.prop`. Returns undefined instead of crashing. |
| **Spread Operator**    | `[...arr]`. Copies array/object elements. |
| **async/await**        | Clean syntax for asynchronous code. |
| **Promise**            | Object representing a future value (API response). |
| **fetch()**            | Browser API for making HTTP requests. |
| **ES Modules**         | `import`/`export` syntax for sharing code between files. |
| **Default Export**     | `export default X`. One per file. Import without `{}`. |
| **Named Export**       | `export { X }`. Multiple per file. Import with `{}`. |
