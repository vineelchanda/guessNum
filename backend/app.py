from flask import Flask, jsonify
from flask_cors import CORS
from flasgger import Swagger, swag_from
import os

from routes.game import game_bp
from routes.gameplay import gameplay_bp

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
Swagger(app, template={
    "info": {
        "title": "GuessNum API",
        "description": "API for the GuessNum multiplayer number guessing game",
        "version": "1.0.0"
    }
})

app.register_blueprint(game_bp)
app.register_blueprint(gameplay_bp)

DOCS = os.path.join(os.path.dirname(__file__), 'docs')


@app.route('/health', methods=['GET'])
@swag_from(os.path.join(DOCS, 'health.yml'))
def health():
    return jsonify({'status': 'ok'}), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
