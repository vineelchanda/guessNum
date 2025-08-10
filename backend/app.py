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
    
    import datetime
    # Set TTL to 30 minutes from now using timezone-aware UTC datetime
    expire_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=30)
    game_data = {
        'player1': player_info,
        'player2': None,
        "player1FourDigit": player_info.get("number"),
        "player2FourDigit": None,
        'turn': 'player1',
        'player1Turns': [],  # Each turn: { 'guess': '1234', 'correct_digits': 0, 'correct_positions': 0 }
        'player2Turns': [],
        'gameStatus': 'ongoing',
        'expireAt': expire_at,
        'gamePhase': 'player1Guessing',  # or similar initial phase
        'currentGuess': None,  
    }
    
    db.collection('games').document(game_id).set(game_data)
    
    return jsonify({'game_id': game_id}), 201

@app.route('/join_game/<game_id>', methods=['POST'])
def join_game(game_id):
    player_info = request.json.get('player_info')
    player2FourDigit = request.json.get('number')
    game_ref = db.collection('games').document(game_id)
    game = game_ref.get()
    
    if not game.exists:
        return jsonify({'error': 'Game not found'}), 404
    
    game_data = game.to_dict()
    
    if game_data['player2'] is not None:
        return jsonify({'error': 'Game already has two players'}), 400

    game_ref.update({'player2': player_info, 'player2FourDigit': player2FourDigit})

    return jsonify({'message': 'Joined game successfully'}), 200

# @app.route('/make_guess/<game_id>', methods=['POST'])
# def make_guess(game_id):
#     guess = request.json.get('guess')
#     player = request.json.get('player')
#     correct_digits = request.json.get('correct_digits')
#     correct_positions = request.json.get('correct_positions')

#     game_ref = db.collection('games').document(game_id)
#     game = game_ref.get()

#     if not game.exists:
#         return jsonify({'error': 'Game not found'}), 404

#     game_data = game.to_dict()

#     if game_data['gameStatus'] != 'ongoing':
#         return jsonify({'error': 'Game has already finished'}), 400

#     # Add the turn to the respective player's turns array
#     turn_data = {
#         'guess': guess,
#         'correct_digits': correct_digits,
#         'correct_positions': correct_positions
#     }
#     if player == 'player1':
#         player1_turns = game_data.get('player1Turns', [])
#         player1_turns.append(turn_data)
#         game_ref.update({'player1Turns': player1_turns, 'turn': 'player2'})
#         game_data['player1Turns'] = player1_turns
#         game_data['turn'] = 'player2'
#     else:
#         player2_turns = game_data.get('player2Turns', [])
#         player2_turns.append(turn_data)
#         game_ref.update({'player2Turns': player2_turns, 'turn': 'player1'})
#         game_data['player2Turns'] = player2_turns
#         game_data['turn'] = 'player1'

#     # Check for win condition
#     if correct_digits == 4 and correct_positions == 4:
#         game_ref.update({'gameStatus': 'finished'})
#         game_data['gameStatus'] = 'finished'

#     # This function is now deprecated and replaced by submit_guess and validate_guess endpoints.
#     return jsonify({'error': 'This endpoint is deprecated. Use /submit_guess and /validate_guess.'}), 400

    # --- New endpoint: submit_guess ---

    
@app.route('/submit_guess/<game_id>', methods=['POST'])
def submit_guess(game_id):
    guess = request.json.get('guess')
    player = request.json.get('player')
    game_ref = db.collection('games').document(game_id)
    game = game_ref.get()
    if not game.exists:
        return jsonify({'error': 'Game not found'}), 404
    game_data = game.to_dict()
    if game_data['gameStatus'] != 'ongoing':
        return jsonify({'error': 'Game has already finished'}), 400

    # Check phase
    if (player == 'player1' and game_data['gamePhase'] != 'player1Guessing') or (player == 'player2' and game_data['gamePhase'] != 'player2Guessing'):
        return jsonify({'error': 'Not your turn to guess'}), 400

    # Store guess in currentGuess and change phase
    game_ref.update({
        'currentGuess': {
            'guess': guess,
            'player': player
        },
        'gamePhase': 'player2Validating' if player == 'player1' else 'player1Validating'
    })
    return jsonify({'message': 'Guess submitted, waiting for validation'}), 200

# --- New endpoint: validate_guess ---
@app.route('/validate_guess/<game_id>', methods=['POST'])
def validate_guess(game_id):
    correct_digits = request.json.get('correct_digits')
    correct_positions = request.json.get('correct_positions')
    validator = request.json.get('player')  # The player who is validating
    game_ref = db.collection('games').document(game_id)
    game = game_ref.get()
    if not game.exists:
        return jsonify({'error': 'Game not found'}), 404
    game_data = game.to_dict()
    if game_data['gameStatus'] != 'ongoing':
        return jsonify({'error': 'Game has already finished'}), 400

    # Check phase
    if (validator == 'player2' and game_data['gamePhase'] != 'player2Validating') or (validator == 'player1' and game_data['gamePhase'] != 'player1Validating'):
        return jsonify({'error': 'Not your turn to validate'}), 400

    # Get the guess
    current_guess = game_data.get('currentGuess')
    if not current_guess:
        return jsonify({'error': 'No guess to validate'}), 400
    guess = current_guess['guess']
    guesser = current_guess['player']

    turn_data = {
        'guess': guess,
        'correct_digits': correct_digits,
        'correct_positions': correct_positions
    }
    # Add turn to the correct player's turns
    if guesser == 'player1':
        player1_turns = game_data.get('player1Turns', [])
        player1_turns.append(turn_data)
        update_data = {'player1Turns': player1_turns}
    else:
        player2_turns = game_data.get('player2Turns', [])
        player2_turns.append(turn_data)
        update_data = {'player2Turns': player2_turns}

    # Check for win
    if correct_digits == 4 and correct_positions == 4:
        update_data['gameStatus'] = 'finished'
        update_data['gamePhase'] = 'finished'
    else:
        # Switch to next phase
        if validator == 'player2':
            update_data['gamePhase'] = 'player2Guessing'
        else:
            update_data['gamePhase'] = 'player1Guessing'
    update_data['currentGuess'] = None
    game_ref.update(update_data)
    return jsonify({'message': 'Guess validated', 'gameStatus': update_data.get('gameStatus', 'ongoing'), 'gamePhase': update_data.get('gamePhase')}), 200

# @app.route('/game_status/<game_id>', methods=['GET'])
# def game_status(game_id):
#     game_ref = db.collection('games').document(game_id)
#     game = game_ref.get()

#     if not game.exists:
#         return jsonify({'error': 'Game not found'}), 404

#     return jsonify(game.to_dict()), 200

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=8080)