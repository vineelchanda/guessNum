import os
import random
import datetime

from flask import Blueprint, request, jsonify
from flasgger import swag_from

from database import db
from system_player import SystemPlayer, system_players

DOCS = os.path.join(os.path.dirname(__file__), '..', 'docs')

game_bp = Blueprint('game', __name__)


@game_bp.route('/create_game', methods=['POST'])
@swag_from(os.path.join(DOCS, 'create_game.yml'))
def create_game():
    game_id = str(random.randint(1000, 9999))
    player_info = request.json.get('player_info')

    expire_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=30)
    game_data = {
        'player1': player_info,
        'player2': None,
        'player1FourDigit': player_info.get('number'),
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
    game_id = str(random.randint(1000, 9999))
    player_info = request.json.get('player_info')

    expire_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=30)

    system_number = f"{random.randint(0, 9999):04d}"
    system_players[game_id] = SystemPlayer()

    game_data = {
        'player1': player_info,
        'player2': {'name': 'System', 'number': system_number},
        'player1FourDigit': player_info.get('number'),
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


@game_bp.route('/game_status/<game_id>', methods=['GET'])
@swag_from(os.path.join(DOCS, 'game_status.yml'))
def game_status(game_id):
    game_ref = db.collection('games').document(game_id)
    game = game_ref.get()

    if not game.exists:
        return jsonify({'error': 'Game not found'}), 404

    return jsonify(game.to_dict()), 200
