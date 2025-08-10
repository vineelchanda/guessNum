// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your own Firebase config from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCGrAekXtlHLrW8GvmGDRcWb4Kn8Q64pZg",
  authDomain: "aesthetic-cacao-314106.firebaseapp.com",
  databaseURL: "https://aesthetic-cacao-314106-default-rtdb.firebaseio.com",
  projectId: "aesthetic-cacao-314106",
  storageBucket: "aesthetic-cacao-314106.appspot.com",
  messagingSenderId: "975779030831",
  appId: "1:975779030831:web:1d54559b0727d25553e3da",
  measurementId: "G-DPFZS5RTQR",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

console.log(db);

export { app, db };
