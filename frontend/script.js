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