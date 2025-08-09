from flask import Flask, request, jsonify
from flask_cors import CORS
from google.cloud import firestore
import random

app = Flask(__name__)
CORS(app)

db = firestore.Client()

@app.route('/create_game', methods=['POST'])
def create_game():
    game_id = str(random.randint(1000, 9999))
    player_info = request.json.get('player_info')
    
    game_data = {
        'player1': player_info,
        'player2': None,
        'turn': 'player1',
        'player1Guess': None,
        'player2Guess': None,
        'player1GuessResult': None,
        'player2GuessResult': None,
        'gameStatus': 'ongoing'
    }
    
    db.collection('games').document(game_id).set(game_data)
    
    return jsonify({'game_id': game_id}), 201

@app.route('/join_game/<game_id>', methods=['POST'])
def join_game(game_id):
    player_info = request.json.get('player_info')
    game_ref = db.collection('games').document(game_id)
    game = game_ref.get()
    
    if not game.exists:
        return jsonify({'error': 'Game not found'}), 404
    
    game_data = game.to_dict()
    
    if game_data['player2'] is not None:
        return jsonify({'error': 'Game already has two players'}), 400
    
    game_ref.update({'player2': player_info})
    
    return jsonify({'message': 'Joined game successfully'}), 200

@app.route('/make_guess/<game_id>', methods=['POST'])
def make_guess(game_id):
    guess = request.json.get('guess')
    player = request.json.get('player')
    
    game_ref = db.collection('games').document(game_id)
    game = game_ref.get()
    
    if not game.exists:
        return jsonify({'error': 'Game not found'}), 404
    
    game_data = game.to_dict()
    
    if game_data['gameStatus'] != 'ongoing':
        return jsonify({'error': 'Game has already finished'}), 400
    
    if player == 'player1':
        game_ref.update({'player1Guess': guess})
        game_data['player1Guess'] = guess
        game_data['turn'] = 'player2'
    else:
        game_ref.update({'player2Guess': guess})
        game_data['player2Guess'] = guess
        game_data['turn'] = 'player1'
    
    # Logic to validate guesses and update results would go here
    # For now, we will just return the current game state
    return jsonify(game_data), 200

@app.route('/game_status/<game_id>', methods=['GET'])
def game_status(game_id):
    game_ref = db.collection('games').document(game_id)
    game = game_ref.get()
    
    if not game.exists:
        return jsonify({'error': 'Game not found'}), 404
    
    return jsonify(game.to_dict()), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)