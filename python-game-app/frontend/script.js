const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

document.getElementById('createGameBtn').addEventListener('click', createGame);
document.getElementById('joinGameBtn').addEventListener('click', joinGame);

function createGame() {
    const gameId = generateGameId();
    const playerInfo = { name: "Player 1" }; // Replace with actual player info

    db.collection("games").doc(gameId).set({
        player1: playerInfo,
        turn: "player1",
        player1Guess: null,
        player2Guess: null,
        player1GuessResult: null,
        player2GuessResult: null,
        gameStatus: "ongoing"
    }).then(() => {
        alert(`Game created! Your Game ID is: ${gameId}`);
        window.location.href = `game.html?gameId=${gameId}`;
    });
}

function joinGame() {
    const gameId = document.getElementById('gameIdInput').value;

    db.collection("games").doc(gameId).get().then((doc) => {
        if (doc.exists) {
            const playerInfo = { name: "Player 2" }; // Replace with actual player info
            db.collection("games").doc(gameId).update({
                player2: playerInfo
            }).then(() => {
                alert(`Joined game with ID: ${gameId}`);
                window.location.href = `game.html?gameId=${gameId}`;
            });
        } else {
            alert("Game ID does not exist.");
        }
    });
}

function generateGameId() {
    return Math.floor(1000 + Math.random() * 9000).toString(); // Generates a 4-digit ID
}

function listenForGameUpdates(gameId) {
    db.collection("games").doc(gameId).onSnapshot((doc) => {
        const data = doc.data();
        updateGameUI(data);
    });
}

function updateGameUI(data) {
    // Update the UI based on the game state
    document.getElementById('currentTurn').innerText = `Current Turn: ${data.turn}`;
    // Additional UI updates for guesses and results
}

document.getElementById('guessForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const guess = document.getElementById('guessInput').value;
    const gameId = new URLSearchParams(window.location.search).get('gameId');

    db.collection("games").doc(gameId).update({
        [`${data.turn}Guess`]: guess
    }).then(() => {
        // Handle guess result logic here
    });
});