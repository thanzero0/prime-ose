"""
Prime-Ose — Minimal Flask server for the rhythm game.
Serves static files and provides a simple API.
"""

from flask import Flask, jsonify, send_from_directory
import os

app = Flask(__name__, static_folder='static', static_url_path='')


@app.route('/')
def index():
    """Serve the main game page."""
    return send_from_directory('static', 'index.html')


@app.route('/api/songs')
def get_songs():
    """Return available songs list."""
    songs = [
        {
            "id": "digital-pulse",
            "title": "Digital Pulse",
            "artist": "Prime-Ose",
            "bpm": 120,
            "duration": "1:30",
            "difficulty": {"easy": 2, "normal": 4, "hard": 6},
            "color": "#ff66ab"
        },
        {
            "id": "neon-dreams",
            "title": "Neon Dreams",
            "artist": "Prime-Ose",
            "bpm": 140,
            "duration": "1:20",
            "difficulty": {"easy": 3, "normal": 5, "hard": 7},
            "color": "#66ccff"
        },
        {
            "id": "cyber-rush",
            "title": "Cyber Rush",
            "artist": "Prime-Ose",
            "bpm": 160,
            "duration": "1:10",
            "difficulty": {"easy": 4, "normal": 6, "hard": 8},
            "color": "#a566ff"
        }
    ]
    return jsonify(songs)


if __name__ == '__main__':
    app.run(debug=True, port=5000)
