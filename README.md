# Python Game App

## Overview
This project is a simple two-player number guessing game built using Python for the backend and HTML/CSS/JavaScript for the frontend. Players can create or join a game using a unique 4-digit game ID. The game utilizes Firestore for real-time updates and data storage.

## Project Structure
```
python-game-app
├── backend
│   ├── app.py            # Main backend logic for game handling
│   ├── requirements.txt  # Dependencies for the backend application
│   └── Dockerfile        # Instructions to build the Docker image for the backend
├── frontend
│   ├── index.html        # Landing page for creating or joining a game
│   ├── game.html         # Game page for inputting guesses and displaying results
│   ├── script.js         # JavaScript for handling user interactions and real-time updates
│   └── styles.css        # Styles for the frontend pages
├── README.md             # Documentation for the project
└── .gitignore            # Files and directories to be ignored by Git
```

## Setup Instructions

### Backend
1. Navigate to the `backend` directory.
2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Run the backend application:
   ```
   python app.py
   ```

### Frontend
1. Open `index.html` in a web browser to access the game interface.

## Usage
- **Creating a Game**: Click on "Create Game" to generate a unique game ID. Share this ID with the second player.
- **Joining a Game**: Enter the game ID provided by the first player to join the game.
- **Gameplay**: Players take turns guessing a 4-digit number. The game will provide real-time feedback on the guesses.

## Firestore Integration
This application uses Firestore for storing game data and providing real-time updates. Ensure that you have set up Firestore and configured the necessary permissions for the application to interact with the database.

## Docker
To build and run the backend in a Docker container:
1. Navigate to the `backend` directory.
2. Build the Docker image:
   ```
   docker build -t python-game-app .
   ```
3. Run the Docker container:
   ```
   docker run -p 8080:8080 python-game-app
   ```

## Contributing
Feel free to fork the repository and submit pull requests for any improvements or features you would like to add.

## License
This project is licensed under the MIT License.