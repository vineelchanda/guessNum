import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

// Listen to a document for real-time updates
export function listenToGame(gameId, onChange) {
  const unsub = onSnapshot(doc(db, "games", gameId), (docSnap) => {
    if (docSnap.exists()) {
      onChange(docSnap.data());
    }
  });
  return unsub; // Call this function to unsubscribe when needed
}
