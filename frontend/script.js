// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";


// const firebaseConfig = {
//   apiKey: "AIzaSyCGrAekXtlHLrW8GvmGDRcWb4Kn8Q64pZg",
//   authDomain: "aesthetic-cacao-314106.firebaseapp.com",
//   databaseURL: "https://aesthetic-cacao-314106-default-rtdb.firebaseio.com",
//   projectId: "aesthetic-cacao-314106",
//   storageBucket: "aesthetic-cacao-314106.appspot.com",
//   messagingSenderId: "975779030831",
//   appId: "1:975779030831:web:1d54559b0727d25553e3da",
//   measurementId: "G-DPFZS5RTQR"
// };

// firebase.initializeApp(firebaseConfig);

// const db = firebase.firestore();

// document.getElementById('createGameBtn').addEventListener('click', createGame);
// document.getElementById('joinGameBtn').addEventListener('click', joinGame);

// function createGame() {
//     const gameId = generateGameId();
//     const playerInfo = { name: "Player 1" }; // Replace with actual player info

//     db.collection("games").doc(gameId).set({
//         player1: playerInfo,
//         turn: "player1",
//         player1Guess: null,
//         player2Guess: null,
//         player1GuessResult: null,
//         player2GuessResult: null,
//         gameStatus: "ongoing"
//     }).then(() => {
//         alert(`Game created! Your Game ID is: ${gameId}`);
//         window.location.href = `game.html?gameId=${gameId}`;
//     });
// }

// function joinGame() {
//     const gameId = document.getElementById('gameIdInput').value;

//     db.collection("games").doc(gameId).get().then((doc) => {
//         if (doc.exists) {
//             const playerInfo = { name: "Player 2" }; // Replace with actual player info
//             db.collection("games").doc(gameId).update({
//                 player2: playerInfo
//             }).then(() => {
//                 alert(`Joined game with ID: ${gameId}`);
//                 window.location.href = `game.html?gameId=${gameId}`;
//             });
//         } else {
//             alert("Game ID does not exist.");
//         }
//     });
// }

// function generateGameId() {
//     return Math.floor(1000 + Math.random() * 9000).toString(); // Generates a 4-digit ID
// }

// function listenForGameUpdates(gameId) {
//     db.collection("games").doc(gameId).onSnapshot((doc) => {
//         const data = doc.data();
//         updateGameUI(data);
//     });
// }

// function updateGameUI(data) {
//     // Update the UI based on the game state
//     document.getElementById('currentTurn').innerText = `Current Turn: ${data.turn}`;
//     // Additional UI updates for guesses and results
// }

// document.getElementById('guessForm').addEventListener('submit', (e) => {
//     e.preventDefault();
//     const guess = document.getElementById('guessInput').value;
//     const gameId = new URLSearchParams(window.location.search).get('gameId');

//     db.collection("games").doc(gameId).update({
//         [`${data.turn}Guess`]: guess
//     }).then(() => {
//         // Handle guess result logic here
//     });
// });

const API_BASE = "https://guessnum-975779030831.asia-south1.run.app";

document.getElementById('create-game').addEventListener('click', createGame);
document.getElementById('join-game').addEventListener('click', showJoinSection);
document.getElementById('submit-join').addEventListener('click', joinGame);

function createGame() {
    fetch(`${API_BASE}/create_game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_info: { name: "Player 1" } })
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById('game-id').innerText = data.game_id;
        document.getElementById('game-id-section').style.display = "block";
        document.getElementById('game-options').style.display = "none";
    })
    .catch(err => alert("Error creating game: " + err));
}

function showJoinSection() {
    document.getElementById('join-game-section').style.display = "block";
    document.getElementById('game-options').style.display = "none";
}

function joinGame() {
    const gameId = document.getElementById('game-id-input').value;
    fetch(`${API_BASE}/join_game/${gameId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_info: { name: "Player 2" } })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            document.getElementById('game-options').style.display = "block";
            document.getElementById('join-game-section').style.display = "none";
        } else {
            alert("Joined game " + gameId + " successfully!");
            // You can redirect or update UI here
        }
    })
    .catch(err => alert("Error joining game: " + err));
}