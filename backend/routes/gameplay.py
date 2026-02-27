import os
import threading
import time

from flask import Blueprint, request, jsonify
from flasgger import swag_from

from database import db
from system_player import SystemPlayer
from routes.game import is_valid_four_digit

DOCS = os.path.join(os.path.dirname(__file__), '..', 'docs')

gameplay_bp = Blueprint('gameplay', __name__)


def _make_system_player(game_data):
    """Reconstruct a SystemPlayer from stored game state, no global dict needed."""
    sp = SystemPlayer()
    for turn in game_data.get('player2Turns', []):
        sp.add_guess(turn['guess'])
    return sp


def handle_system_turn(game_id):
    def system_turn():
        time.sleep(2)

        game_ref = db.collection('games').document(game_id)
        game = game_ref.get()

        if not game.exists:
            return

        game_data = game.to_dict()

        if (game_data.get('gameStatus') != 'ongoing' or
                not game_data.get('isSystemGame')):
            return

        phase = game_data.get('gamePhase')

        if phase == 'player2Guessing':
            # System makes its guess, reconstructed fresh from Firestore state
            system_player = _make_system_player(game_data)
            player1_turns = game_data.get('player1Turns', [])
            guess = system_player.make_intelligent_guess(player1_turns)

            game_ref.update({
                'currentGuess': {'guess': guess, 'player': 'player2'},
                'gamePhase': 'player1Validating',
                'turn': 'player1',
            })

            # System auto-validates its own guess immediately after making it
            threading.Thread(target=handle_system_turn, args=(game_id,), daemon=True).start()

        elif phase == 'player2Validating':
            # System validates player1's guess against the system's number
            current_guess = game_data.get('currentGuess')
            if current_guess and current_guess.get('player') == 'player1':
                system_number = game_data.get('player2FourDigit')
                guess = current_guess.get('guess')

                system_player = _make_system_player(game_data)
                result = system_player.validate_guess(guess, system_number)

                player1_turns = game_data.get('player1Turns', [])
                player1_turns.append({
                    'guess': guess,
                    'correct_digits': result['correct_digits'],
                    'correct_positions': result['correct_positions'],
                })

                update_data = {'player1Turns': player1_turns}
                if result['correct_digits'] == 4 and result['correct_positions'] == 4:
                    update_data.update({
                        'gameStatus': 'finished',
                        'gamePhase': 'finished',
                        'turn': None,
                        'winner': game_data.get('player1', {}).get('name', 'Player 1'),
                    })
                else:
                    update_data.update({'gamePhase': 'player2Guessing', 'turn': 'player2'})

                update_data['currentGuess'] = None
                game_ref.update(update_data)

                if update_data.get('turn') == 'player2':
                    threading.Thread(target=handle_system_turn, args=(game_id,), daemon=True).start()

        elif phase == 'player1Validating':
            # System auto-validates its own guess against player1's number
            current_guess = game_data.get('currentGuess')
            if current_guess and current_guess.get('player') == 'player2':
                player1_number = game_data.get('player1FourDigit')
                guess = current_guess.get('guess')

                system_player = _make_system_player(game_data)
                result = system_player.validate_guess(guess, player1_number)

                player2_turns = game_data.get('player2Turns', [])
                player2_turns.append({
                    'guess': guess,
                    'correct_digits': result['correct_digits'],
                    'correct_positions': result['correct_positions'],
                })

                update_data = {'player2Turns': player2_turns}
                if result['correct_digits'] == 4 and result['correct_positions'] == 4:
                    update_data.update({
                        'gameStatus': 'finished',
                        'gamePhase': 'finished',
                        'turn': None,
                        'winner': 'System',
                    })
                else:
                    update_data.update({'gamePhase': 'player1Guessing', 'turn': 'player1'})

                update_data['currentGuess'] = None
                game_ref.update(update_data)

    threading.Thread(target=system_turn, daemon=True).start()


@gameplay_bp.route('/submit_guess/<game_id>', methods=['POST'])
@swag_from(os.path.join(DOCS, 'submit_guess.yml'))
def submit_guess(game_id):
    guess = request.json.get('guess')
    player = request.json.get('player')

    if not is_valid_four_digit(guess):
        return jsonify({'error': 'Guess must be a 4-digit string with all unique digits'}), 400

    game_ref = db.collection('games').document(game_id)
    game = game_ref.get()

    if not game.exists:
        return jsonify({'error': 'Game not found'}), 404

    game_data = game.to_dict()

    if game_data['gameStatus'] != 'ongoing':
        return jsonify({'error': 'Game has already finished'}), 400

    if (player == 'player1' and game_data['gamePhase'] != 'player1Guessing') or \
       (player == 'player2' and game_data['gamePhase'] != 'player2Guessing'):
        return jsonify({'error': 'Not your turn to guess'}), 400

    next_phase = 'player2Validating' if player == 'player1' else 'player1Validating'
    next_turn = 'player2' if player == 'player1' else 'player1'

    game_ref.update({
        'currentGuess': {'guess': guess, 'player': player},
        'gamePhase': next_phase,
        'turn': next_turn,
    })

    if game_data.get('isSystemGame') and next_turn == 'player2':
        handle_system_turn(game_id)

    return jsonify({'message': 'Guess submitted, waiting for validation'}), 200


@gameplay_bp.route('/validate_guess/<game_id>', methods=['POST'])
@swag_from(os.path.join(DOCS, 'validate_guess.yml'))
def validate_guess(game_id):
    validator = request.json.get('player')
    game_ref = db.collection('games').document(game_id)
    game = game_ref.get()

    if not game.exists:
        return jsonify({'error': 'Game not found'}), 404

    game_data = game.to_dict()

    if game_data['gameStatus'] != 'ongoing':
        return jsonify({'error': 'Game has already finished'}), 400

    if (validator == 'player2' and game_data['gamePhase'] != 'player2Validating') or \
       (validator == 'player1' and game_data['gamePhase'] != 'player1Validating'):
        return jsonify({'error': 'Not your turn to validate'}), 400

    current_guess = game_data.get('currentGuess')
    if not current_guess:
        return jsonify({'error': 'No guess to validate'}), 400

    guess = current_guess['guess']
    guesser = current_guess['player']

    # Server computes the result — client input for digits/positions is ignored
    # validator's own secret number is the answer
    answer = game_data.get('player2FourDigit') if validator == 'player2' else game_data.get('player1FourDigit')
    sp = SystemPlayer()
    result = sp.validate_guess(guess, answer)
    correct_digits = result['correct_digits']
    correct_positions = result['correct_positions']

    turn_data = {
        'guess': guess,
        'correct_digits': correct_digits,
        'correct_positions': correct_positions,
    }

    if guesser == 'player1':
        player1_turns = game_data.get('player1Turns', [])
        player1_turns.append(turn_data)
        update_data = {'player1Turns': player1_turns}
    else:
        player2_turns = game_data.get('player2Turns', [])
        player2_turns.append(turn_data)
        update_data = {'player2Turns': player2_turns}

    if correct_digits == 4 and correct_positions == 4:
        winner = game_data.get('player1', {}).get('name', 'Player 1') if guesser == 'player1' else game_data.get('player2', {}).get('name', 'Player 2')
        update_data.update({
            'gameStatus': 'finished',
            'gamePhase': 'finished',
            'turn': None,
            'winner': winner,
        })
    else:
        if validator == 'player2':
            update_data.update({'gamePhase': 'player2Guessing', 'turn': 'player2'})
        else:
            update_data.update({'gamePhase': 'player1Guessing', 'turn': 'player1'})

    update_data['currentGuess'] = None
    game_ref.update(update_data)

    if game_data.get('isSystemGame') and update_data.get('turn') == 'player2':
        handle_system_turn(game_id)

    return jsonify({
        'message': 'Guess validated',
        'gameStatus': update_data.get('gameStatus', 'ongoing'),
        'gamePhase': update_data.get('gamePhase'),
        'turn': update_data.get('turn'),
    }), 200
