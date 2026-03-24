"""
Casino Loyalty Program — Flask Web Application
Dependencies: flask, sqlite3 (both pip-installable / stdlib)
Run: python app.py  then open http://localhost:5000
"""

from flask import Flask, render_template, request, jsonify
import sqlite3
import uuid
import os
from datetime import date

app = Flask(__name__)

# ──────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────
DB_FILE = os.path.join(os.path.dirname(__file__), "casino_loyalty.db")

GAMES = {
    "Boul":  0.10,
    "Game2": 0.20,
    "Game3": 0.30,
    "Game4": 0.40,
    "Game5": 0.50,
}

TIERS = [
    (0,      50_000,       "Bronze"),
    (50_001, 70_000,       "Silver"),
    (70_001, float("inf"), "Gold"),
]


# ──────────────────────────────────────────────
# Database helpers
# ──────────────────────────────────────────────
def get_connection():
    con = sqlite3.connect(DB_FILE)
    con.row_factory = sqlite3.Row
    return con


def init_db():
    with get_connection() as con:
        con.execute("""
            CREATE TABLE IF NOT EXISTS players (
                player_id     INTEGER PRIMARY KEY,
                total_wagered REAL    NOT NULL DEFAULT 0,
                total_points  REAL    NOT NULL DEFAULT 0,
                tier          TEXT    NOT NULL DEFAULT 'Bronze'
            )
        """)
        con.execute("""
            CREATE TABLE IF NOT EXISTS tickets (
                ticket_number TEXT    PRIMARY KEY,
                player_id     INTEGER NOT NULL,
                game          TEXT    NOT NULL,
                amount_bet    REAL    NOT NULL,
                points_earned REAL    NOT NULL,
                date_played   TEXT    NOT NULL,
                FOREIGN KEY (player_id) REFERENCES players(player_id)
            )
        """)
        for pid in range(1, 21):
            con.execute(
                "INSERT OR IGNORE INTO players (player_id, total_wagered, total_points, tier) "
                "VALUES (?, 0, 0, 'Bronze')",
                (pid,)
            )
        con.commit()


def calculate_tier(total_wagered: float) -> str:
    for low, high, name in TIERS:
        if low <= total_wagered <= high:
            return name
    return "Gold"


# ──────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────
@app.route("/")
def index():
    return render_template(
        "index.html",
        games=list(GAMES.keys()),
        today=str(date.today()),
    )


@app.route("/api/place_bet", methods=["POST"])
def api_place_bet():
    data = request.get_json()
    try:
        player_id  = int(data["player_id"])
        game       = data["game"]
        amount_bet = float(data["amount_bet"])
        date_str   = data["date_played"]

        if player_id < 1 or player_id > 20:
            raise ValueError("Player ID out of range")
        if game not in GAMES:
            raise ValueError("Unknown game")
        if amount_bet <= 0:
            raise ValueError("Amount must be positive")
        date.fromisoformat(date_str)   # validate format
    except (KeyError, ValueError, TypeError) as e:
        return jsonify({"error": str(e)}), 400

    multiplier    = GAMES[game]
    points        = round(amount_bet * multiplier, 2)
    ticket_number = str(uuid.uuid4()).upper()

    with get_connection() as con:
        con.execute(
            "INSERT INTO tickets (ticket_number, player_id, game, amount_bet, points_earned, date_played) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (ticket_number, player_id, game, amount_bet, points, date_str)
        )
        con.execute(
            "UPDATE players SET total_wagered = total_wagered + ?, total_points = total_points + ? "
            "WHERE player_id = ?",
            (amount_bet, points, player_id)
        )
        row = con.execute("SELECT total_wagered FROM players WHERE player_id = ?", (player_id,)).fetchone()
        tier = calculate_tier(row["total_wagered"])
        con.execute("UPDATE players SET tier = ? WHERE player_id = ?", (tier, player_id))
        con.commit()

    return jsonify({
        "ticket": {
            "ticket_number": ticket_number,
            "player_id":     player_id,
            "game":          game,
            "amount_bet":    amount_bet,
            "points_earned": points,
            "date_played":   date_str,
        }
    })


@app.route("/api/players")
def api_players():
    with get_connection() as con:
        rows = con.execute(
            "SELECT player_id, total_wagered, total_points, tier FROM players ORDER BY player_id"
        ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/tickets")
def api_tickets():
    with get_connection() as con:
        rows = con.execute(
            "SELECT ticket_number, player_id, game, amount_bet, points_earned, date_played "
            "FROM tickets ORDER BY rowid DESC"
        ).fetchall()
    return jsonify([dict(r) for r in rows])


# ──────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────
if __name__ == "__main__":
    init_db()
    app.run(debug=True, host="0.0.0.0", port=5000)
