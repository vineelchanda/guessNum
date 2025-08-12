from flask import Flask, request, jsonify
from flask_cors import CORS
from google.cloud import firestore
import random
import threading
import time

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

db = firestore.Client()

# System player intelligent guessing logic
class SystemPlayer:
    def __init__(self):
        self.possible_numbers = set(f"{i:04d}" for i in range(10000))
        self.guessed_numbers = set()
    
    def validate_guess(self, guess, answer):
        """Validate a guess against the answer"""
        if not guess or not answer:
            return {'correct_digits': 0, 'correct_positions': 0}
        
        guess_str = str(guess).zfill(4)
        answer_str = str(answer).zfill(4)
        
        correct_positions = 0
        correct_digits = 0
        
        # Count correct positions
        for i in range(4):
            if guess_str[i] == answer_str[i]:
                correct_positions += 1
        
        # Count correct digits (including those in correct positions)
        guess_digits = {}
        answer_digits = {}
        
        for digit in guess_str:
            guess_digits[digit] = guess_digits.get(digit, 0) + 1
        
        for digit in answer_str:
            answer_digits[digit] = answer_digits.get(digit, 0) + 1
        
        for digit in guess_digits:
            if digit in answer_digits:
                correct_digits += min(guess_digits[digit], answer_digits[digit])
        
        return {'correct_digits': correct_digits, 'correct_positions': correct_positions}
    
    def make_intelligent_guess(self, previous_guesses):
        """Make an intelligent guess based on previous feedback"""
        if not previous_guesses:
            # First guess - use a common strategy
            return "1234"
        
        # Filter possible numbers based on previous guesses
        valid_numbers = []
        
        for number in self.possible_numbers:
            if number in self.guessed_numbers:
                continue
                
            is_valid = True
            for prev_guess in previous_guesses:
                guess = prev_guess['guess']
                expected_result = self.validate_guess(guess, number)
                actual_result = {
                    'correct_digits': prev_guess['correct_digits'],
                    'correct_positions': prev_guess['correct_positions']
                }
                
                if expected_result != actual_result:
                    is_valid = False
                    break
            
            if is_valid:
                valid_numbers.append(number)
        
        if valid_numbers:
            # Choose a number that maximizes information gain
            return random.choice(valid_numbers)
        else:
            # Fallback to random if no valid numbers found
            available = [n for n in self.possible_numbers if n not in self.guessed_numbers]
            return random.choice(available) if available else "0000"
    
    def add_guess(self, guess):
        """Track guessed numbers"""
        self.guessed_numbers.add(str(guess).zfill(4))

system_players = {}  # Store system player instances per game

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
        'gameStatus': 'waiting_for_player2',
        'expireAt': expire_at,
        'gamePhase': 'player1Guessing',  # or similar initial phase
        'currentGuess': None,  
    }
    
    db.collection('games').document(game_id).set(game_data)
    
    return jsonify({'game_id': game_id}), 201

@app.route('/create_game_vs_system', methods=['POST'])
def create_game_vs_system():
    game_id = str(random.randint(1000, 9999))
    player_info = request.json.get('player_info')
    
    import datetime
    # Set TTL to 30 minutes from now
    expire_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=30)
    
    # Generate system's number
    system_number = f"{random.randint(0, 9999):04d}"
    system_player = SystemPlayer()
    system_players[game_id] = system_player
    
    game_data = {
        'player1': player_info,
        'player2': {'name': 'System', 'number': system_number},
        "player1FourDigit": player_info.get("number"),
        "player2FourDigit": system_number,
        'turn': 'player1',
        'player1Turns': [],
        'player2Turns': [],
        'gameStatus': 'ongoing',  # System joins immediately
        'expireAt': expire_at,
        'gamePhase': 'player1Guessing',
        'currentGuess': None,
        'isSystemGame': True
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

    game_ref.update({'player2': player_info, 'player2FourDigit': player2FourDigit, 'gameStatus': 'ongoing'})

    return jsonify({'message': 'Joined game successfully'}), 200
    
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
    # Update currentGuess, gamePhase, and turn
    next_phase = 'player2Validating' if player == 'player1' else 'player1Validating'
    next_turn = 'player2' if player == 'player1' else 'player1'
    game_ref.update({
        'currentGuess': {
            'guess': guess,
            'player': player
        },
        'gamePhase': next_phase,
        'turn': next_turn
    })
    
    # If this is a system game and we just set it to system's validation turn, trigger system logic
    if game_data.get('isSystemGame') and next_turn == 'player2':
        handle_system_turn(game_id)
    
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
        update_data['turn'] = None
    else:
        # Switch to next phase and update turn
        if validator == 'player2':
            update_data['gamePhase'] = 'player2Guessing'
            update_data['turn'] = 'player2'
        else:
            update_data['gamePhase'] = 'player1Guessing'
            update_data['turn'] = 'player1'
    update_data['currentGuess'] = None
    game_ref.update(update_data)
    
    # If this is a system game and we just set turn to system, trigger system logic
    if game_data.get('isSystemGame') and update_data.get('turn') == 'player2':
        handle_system_turn(game_id)
    
    return jsonify({'message': 'Guess validated', 'gameStatus': update_data.get('gameStatus', 'ongoing'), 'gamePhase': update_data.get('gamePhase'), 'turn': update_data.get('turn')}), 200

def handle_system_turn(game_id):
    """Handle system's turn automatically"""
    def system_turn():
        time.sleep(2)  # Add delay to simulate thinking
        
        game_ref = db.collection('games').document(game_id)
        game = game_ref.get()
        
        if not game.exists:
            return
        
        game_data = game.to_dict()
        
        # Check if it's still system's turn and game is ongoing
        if (game_data.get('gameStatus') != 'ongoing' or 
            game_data.get('turn') != 'player2' or
            not game_data.get('isSystemGame')):
            return
        
        phase = game_data.get('gamePhase')
        
        if phase == 'player2Guessing':
            # System makes a guess
            system_player = system_players.get(game_id)
            if not system_player:
                system_player = SystemPlayer()
                system_players[game_id] = system_player
            
            player1_turns = game_data.get('player1Turns', [])
            guess = system_player.make_intelligent_guess(player1_turns)
            system_player.add_guess(guess)
            
            # Submit system's guess
            game_ref.update({
                'currentGuess': {
                    'guess': guess,
                    'player': 'player2'
                },
                'gamePhase': 'player1Validating',
                'turn': 'player1'
            })
            
        elif phase == 'player1Validating':
            # System validates player1's guess automatically
            current_guess = game_data.get('currentGuess')
            if current_guess and current_guess.get('player') == 'player1':
                system_number = game_data.get('player2FourDigit')
                guess = current_guess.get('guess')
                
                system_player = system_players.get(game_id, SystemPlayer())
                result = system_player.validate_guess(guess, system_number)
                
                # Add the turn to player1's turns
                player1_turns = game_data.get('player1Turns', [])
                turn_data = {
                    'guess': guess,
                    'correct_digits': result['correct_digits'],
                    'correct_positions': result['correct_positions']
                }
                player1_turns.append(turn_data)
                
                # Check for win
                update_data = {'player1Turns': player1_turns}
                if result['correct_digits'] == 4 and result['correct_positions'] == 4:
                    update_data.update({
                        'gameStatus': 'finished',
                        'gamePhase': 'finished',
                        'turn': None,
                        'winner': game_data.get('player1', {}).get('name', 'Player 1')
                    })
                else:
                    update_data.update({
                        'gamePhase': 'player2Guessing',
                        'turn': 'player2'
                    })
                
                update_data['currentGuess'] = None
                game_ref.update(update_data)
                
                # If game continues and it's system's turn, schedule another move
                if update_data.get('turn') == 'player2':
                    threading.Thread(target=handle_system_turn, args=(game_id,), daemon=True).start()
        
        elif phase == 'player2Validating':
            # System validates its own guess automatically
            current_guess = game_data.get('currentGuess')
            if current_guess and current_guess.get('player') == 'player2':
                player1_number = game_data.get('player1FourDigit')
                guess = current_guess.get('guess')
                
                system_player = system_players.get(game_id, SystemPlayer())
                result = system_player.validate_guess(guess, player1_number)
                
                # Add the turn to player2's turns
                player2_turns = game_data.get('player2Turns', [])
                turn_data = {
                    'guess': guess,
                    'correct_digits': result['correct_digits'],
                    'correct_positions': result['correct_positions']
                }
                player2_turns.append(turn_data)
                
                # Check for win
                update_data = {'player2Turns': player2_turns}
                if result['correct_digits'] == 4 and result['correct_positions'] == 4:
                    update_data.update({
                        'gameStatus': 'finished',
                        'gamePhase': 'finished',
                        'turn': None,
                        'winner': 'System'
                    })
                else:
                    update_data.update({
                        'gamePhase': 'player1Guessing',
                        'turn': 'player1'
                    })
                
                update_data['currentGuess'] = None
                game_ref.update(update_data)
    
    threading.Thread(target=system_turn, daemon=True).start()

@app.route('/game_status/<game_id>', methods=['GET'])
def game_status(game_id):
    game_ref = db.collection('games').document(game_id)
    game = game_ref.get()
    if not game.exists:
        return jsonify({'error': 'Game not found'}), 404
    
    game_data = game.to_dict()
    return jsonify(game_data), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)