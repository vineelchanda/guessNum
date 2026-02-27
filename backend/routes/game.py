import os
import random
import datetime

from flask import Blueprint, request, jsonify
from flasgger import swag_from

from database import db

DOCS = os.path.join(os.path.dirname(__file__), '..', 'docs')

game_bp = Blueprint('game', __name__)


def is_valid_four_digit(number):
    """Return True if number is a 4-digit string with all unique digits."""
    s = str(number) if number is not None else ''
    return len(s) == 4 and s.isdigit() and len(set(s)) == 4


def generate_unique_game_id():
    """Generate a 4-digit game ID not already used in Firestore."""
    for _ in range(20):
        game_id = str(random.randint(1000, 9999))
        if not db.collection('games').document(game_id).get().exists:
            return game_id
    raise RuntimeError('Could not generate a unique game ID after 20 attempts')


@game_bp.route('/create_game', methods=['POST'])
@swag_from(os.path.join(DOCS, 'create_game.yml'))
def create_game():
    player_info = request.json.get('player_info')
    number = player_info.get('number') if player_info else None

    if not is_valid_four_digit(number):
        return jsonify({'error': 'Number must be a 4-digit string with all unique digits'}), 400

    game_id = generate_unique_game_id()
    expire_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=30)
    game_data = {
        'player1': player_info,
        'player2': None,
        'player1FourDigit': number,
        'player2FourDigit': None,
        'turn': 'player1',
        'player1Turns': [],
        'player2Turns': [],
        'gameStatus': 'waiting_for_player2',
        'expireAt': expire_at,
        'gamePhase': 'player1Guessing',
        'currentGuess': None,
    }

    db.collection('games').document(game_id).set(game_data)
    return jsonify({'game_id': game_id}), 201


@game_bp.route('/create_game_vs_system', methods=['POST'])
@swag_from(os.path.join(DOCS, 'create_game_vs_system.yml'))
def create_game_vs_system():
    player_info = request.json.get('player_info')
    number = player_info.get('number') if player_info else None

    if not is_valid_four_digit(number):
        return jsonify({'error': 'Number must be a 4-digit string with all unique digits'}), 400

    game_id = generate_unique_game_id()
    expire_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=30)

    system_number = ''.join(random.sample('0123456789', 4))

    game_data = {
        'player1': player_info,
        'player2': {'name': 'System', 'number': system_number},
        'player1FourDigit': number,
        'player2FourDigit': system_number,
        'turn': 'player1',
        'player1Turns': [],
        'player2Turns': [],
        'gameStatus': 'ongoing',
        'expireAt': expire_at,
        'gamePhase': 'player1Guessing',
        'currentGuess': None,
        'isSystemGame': True,
    }

    db.collection('games').document(game_id).set(game_data)
    return jsonify({'game_id': game_id}), 201


@game_bp.route('/join_game/<game_id>', methods=['POST'])
@swag_from(os.path.join(DOCS, 'join_game.yml'))
def join_game(game_id):
    player_info = request.json.get('player_info')
    # Fix: number lives inside player_info, not at the request root
    player2FourDigit = player_info.get('number') if player_info else None
    game_ref = db.collection('games').document(game_id)
    game = game_ref.get()

    if not game.exists:
        return jsonify({'error': 'Game not found'}), 404

    if not is_valid_four_digit(player2FourDigit):
        return jsonify({'error': 'Number must be a 4-digit string with all unique digits'}), 400

    game_data = game.to_dict()

    if game_data['player2'] is not None:
        return jsonify({'error': 'Game already has two players'}), 400

    game_ref.update({'player2': player_info, 'player2FourDigit': player2FourDigit, 'gameStatus': 'ongoing'})
    return jsonify({'message': 'Joined game successfully'}), 200


@game_bp.route('/game_status/<game_id>', methods=['GET'])
@swag_from(os.path.join(DOCS, 'game_status.yml'))
def game_status(game_id):
    game_ref = db.collection('games').document(game_id)
    game = game_ref.get()

    if not game.exists:
        return jsonify({'error': 'Game not found'}), 404

    return jsonify(game.to_dict()), 200


@game_bp.route('/expire_game/<game_id>', methods=['POST'])
def expire_game(game_id):
    """Mark an ongoing game as finished due to timer expiry."""
    game_ref = db.collection('games').document(game_id)
    game = game_ref.get()

    if not game.exists:
        return jsonify({'error': 'Game not found'}), 404

    game_data = game.to_dict()
    if game_data.get('gameStatus') == 'finished':
        return jsonify({'message': 'Game already finished'}), 200

    game_ref.update({
        'gameStatus': 'finished',
        'gamePhase': 'finished',
        'turn': None,
        'winner': None,
    })
    return jsonify({'message': 'Game expired due to timeout'}), 200
