from flask import Blueprint, request, jsonify
from database import db
from datetime import datetime, timezone, timedelta
import hashlib
import random

daily_bp = Blueprint('daily', __name__)


def get_daily_date():
    """Get current daily challenge date. Resets at 1:00 AM UTC."""
    now = datetime.now(timezone.utc)
    adjusted = now - timedelta(hours=1)
    return adjusted.strftime('%Y-%m-%d')


def generate_daily_number(date_str):
    """Generate a deterministic 4-digit number with unique digits for the given date."""
    seed = int(hashlib.sha256(date_str.encode()).hexdigest(), 16) % (2 ** 32)
    rng = random.Random(seed)
    digits = list(range(10))
    rng.shuffle(digits)
    return ''.join(str(d) for d in digits[:4])


@daily_bp.route('/daily_challenge', methods=['GET'])
def get_daily_challenge():
    """Get today's daily challenge info."""
    date = get_daily_date()
    return jsonify({'date': date, 'status': 'active'})


@daily_bp.route('/daily_challenge/start', methods=['POST'])
def start_daily_challenge():
    """Start a new daily challenge game."""
    data = request.json or {}
    player_name = data.get('name', '').strip()
    if not player_name:
        return jsonify({'error': 'Player name required'}), 400

    date = get_daily_date()
    daily_number = generate_daily_number(date)
    start_time = datetime.now(timezone.utc)

    game_ref = db.collection('daily_games').document()
    game_ref.set({
        'playerName': player_name,
        'dailyDate': date,
        'dailyNumber': daily_number,
        'guesses': [],
        'gameStatus': 'ongoing',
        'winner': None,
        'startTime': start_time,
        'endTime': None,
        'timeTaken': None,
        'guessCount': 0,
    })

    return jsonify({'game_id': game_ref.id, 'date': date})


@daily_bp.route('/daily_challenge/guess/<game_id>', methods=['POST'])
def daily_guess(game_id):
    """Submit a guess for a daily challenge game."""
    data = request.json or {}
    guess = data.get('guess', '').strip()

    if not guess.isdigit() or len(guess) != 4 or len(set(guess)) != 4:
        return jsonify({'error': 'Guess must be 4 unique digits'}), 400

    game_ref = db.collection('daily_games').document(game_id)
    game_doc = game_ref.get()

    if not game_doc.exists:
        return jsonify({'error': 'Game not found'}), 404

    game_data = game_doc.to_dict()
    if game_data.get('gameStatus') == 'finished':
        return jsonify({'error': 'Game already finished'}), 400

    daily_number = game_data['dailyNumber']
    correct_positions = sum(g == d for g, d in zip(guess, daily_number))
    correct_digits = sum(g in daily_number for g in guess)

    guess_entry = {
        'guess': guess,
        'correct_digits': correct_digits,
        'correct_positions': correct_positions,
    }

    guesses = list(game_data.get('guesses', []))
    guesses.append(guess_entry)

    update = {
        'guesses': guesses,
        'guessCount': len(guesses),
    }

    time_taken = None
    if correct_positions == 4:
        end_time = datetime.now(timezone.utc)
        start_time = game_data['startTime']
        time_taken = (end_time - start_time).total_seconds()

        update['gameStatus'] = 'finished'
        update['winner'] = game_data['playerName']
        update['endTime'] = end_time
        update['timeTaken'] = round(time_taken, 1)

        _record_to_leaderboard(
            date=game_data['dailyDate'],
            name=game_data['playerName'],
            guesses=len(guesses),
            time_seconds=round(time_taken, 1),
            finished_at=end_time,
        )

    game_ref.update(update)

    return jsonify({
        'correct_digits': correct_digits,
        'correct_positions': correct_positions,
        'guesses': guesses,
        'gameStatus': update.get('gameStatus', 'ongoing'),
        'winner': update.get('winner', None),
        'timeTaken': time_taken,
    })


def _record_to_leaderboard(date, name, guesses, time_seconds, finished_at):
    """Record a completed game to the leaderboard. First completion per name only."""
    leaderboard_ref = db.collection('daily_leaderboard').document(date)
    doc = leaderboard_ref.get()

    entry = {
        'name': name,
        'guesses': guesses,
        'time_seconds': time_seconds,
        'finished_at': finished_at,
    }

    if doc.exists:
        entries = list(doc.to_dict().get('entries', []))
        existing_names = {e['name'] for e in entries}
        if name in existing_names:
            return
        entries.append(entry)
    else:
        entries = [entry]

    entries.sort(key=lambda x: (x['guesses'], x['time_seconds']))
    for i, e in enumerate(entries):
        e['rank'] = i + 1

    leaderboard_ref.set({'date': date, 'entries': entries})


@daily_bp.route('/daily_leaderboard', methods=['GET'])
def get_daily_leaderboard():
    """Get today's daily challenge leaderboard."""
    date = get_daily_date()
    doc = db.collection('daily_leaderboard').document(date).get()

    if not doc.exists:
        return jsonify({'date': date, 'entries': []})

    data = doc.to_dict()
    entries = []
    for entry in data.get('entries', []):
        finished_at = entry.get('finished_at')
        if hasattr(finished_at, 'isoformat'):
            finished_at_str = finished_at.isoformat()
        else:
            finished_at_str = str(finished_at) if finished_at else None

        entries.append({
            'name': entry['name'],
            'guesses': entry['guesses'],
            'time_seconds': entry['time_seconds'],
            'finished_at': finished_at_str,
            'rank': entry.get('rank', 0),
        })

    return jsonify({'date': date, 'entries': entries})
