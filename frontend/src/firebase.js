// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase configuration - using environment variables for security
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCGrAekXtlHLrW8GvmGDRcWb4Kn8Q64pZg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "aesthetic-cacao-314106.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://aesthetic-cacao-314106-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "aesthetic-cacao-314106",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "aesthetic-cacao-314106.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "975779030831",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:975779030831:web:1d54559b0727d25553e3da",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DPFZS5RTQR",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { app, db };
