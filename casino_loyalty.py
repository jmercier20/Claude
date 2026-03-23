"""
Casino Loyalty Program - Windows Desktop Application
Python + Tkinter + SQLite (no external dependencies)
"""

import tkinter as tk
from tkinter import ttk, messagebox
import sqlite3
import uuid
import os
from datetime import date


# ──────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────
DB_FILE = "casino_loyalty.db"

GAMES = {
    "Boul":  0.10,
    "Game2": 0.20,
    "Game3": 0.30,
    "Game4": 0.40,
    "Game5": 0.50,
}

TIERS = [
    (0,       50_000,  "Bronze"),
    (50_001,  70_000,  "Silver"),
    (70_001,  float("inf"), "Gold"),
]

TIER_COLORS = {
    "Bronze": "#cd7f32",
    "Silver": "#c0c0c0",
    "Gold":   "#ffd700",
}

HIGHLIGHT_BG = "#d0f0ff"   # light blue highlight for last-bet player


# ──────────────────────────────────────────────
# Database helpers
# ──────────────────────────────────────────────
def get_connection():
    return sqlite3.connect(DB_FILE)


def init_db():
    """Create tables and seed 20 players if they don't exist."""
    with get_connection() as con:
        cur = con.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS players (
                player_id     INTEGER PRIMARY KEY,
                total_wagered REAL    NOT NULL DEFAULT 0,
                total_points  REAL    NOT NULL DEFAULT 0,
                tier          TEXT    NOT NULL DEFAULT 'Bronze'
            )
        """)
        cur.execute("""
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
        # Seed players 1-20
        for pid in range(1, 21):
            cur.execute(
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


def place_bet(player_id: int, game: str, amount_bet: float, date_played: str) -> dict:
    """Insert ticket, update player stats, return ticket info dict."""
    multiplier   = GAMES[game]
    points       = round(amount_bet * multiplier, 2)
    ticket_num   = str(uuid.uuid4()).upper()

    with get_connection() as con:
        cur = con.cursor()

        # Insert ticket
        cur.execute(
            "INSERT INTO tickets (ticket_number, player_id, game, amount_bet, points_earned, date_played) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (ticket_num, player_id, game, amount_bet, points, date_played)
        )

        # Update player totals
        cur.execute(
            "UPDATE players SET total_wagered = total_wagered + ?, total_points = total_points + ? "
            "WHERE player_id = ?",
            (amount_bet, points, player_id)
        )

        # Recalculate tier
        cur.execute("SELECT total_wagered FROM players WHERE player_id = ?", (player_id,))
        total_wagered = cur.fetchone()[0]
        tier = calculate_tier(total_wagered)
        cur.execute("UPDATE players SET tier = ? WHERE player_id = ?", (tier, player_id))
        con.commit()

    return {
        "ticket_number": ticket_num,
        "player_id":     player_id,
        "game":          game,
        "amount_bet":    amount_bet,
        "points_earned": points,
        "date_played":   date_played,
    }


def fetch_all_players() -> list:
    with get_connection() as con:
        cur = con.cursor()
        cur.execute("SELECT player_id, total_wagered, total_points, tier FROM players ORDER BY player_id")
        return cur.fetchall()


def fetch_all_tickets() -> list:
    with get_connection() as con:
        cur = con.cursor()
        cur.execute(
            "SELECT ticket_number, player_id, game, amount_bet, points_earned, date_played "
            "FROM tickets ORDER BY rowid DESC"
        )
        return cur.fetchall()


# ──────────────────────────────────────────────
# GUI Application
# ──────────────────────────────────────────────
class CasinoApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Casino Loyalty Program")
        self.resizable(True, True)
        self.configure(bg="#1a1a2e")

        self._last_player_id = None
        self._last_ticket    = None

        self._build_ui()
        self._refresh_player_table()

    # ── Layout ──────────────────────────────
    def _build_ui(self):
        # ── Top: title bar ───────────────────
        title_bar = tk.Frame(self, bg="#16213e", pady=8)
        title_bar.pack(fill=tk.X)
        tk.Label(
            title_bar,
            text="♠  CASINO LOYALTY PROGRAM  ♠",
            font=("Helvetica", 18, "bold"),
            fg="#ffd700",
            bg="#16213e",
        ).pack()

        # ── Main pane ────────────────────────
        main = tk.Frame(self, bg="#1a1a2e")
        main.pack(fill=tk.BOTH, expand=True, padx=12, pady=8)
        main.columnconfigure(0, weight=1)
        main.columnconfigure(1, weight=3)
        main.rowconfigure(0, weight=1)

        # Left: input form
        self._build_form(main)

        # Right: player table + ticket bar
        self._build_right_panel(main)

    # ── Bet Form ─────────────────────────────
    def _build_form(self, parent):
        form_frame = tk.LabelFrame(
            parent, text="  Place a Bet  ",
            font=("Helvetica", 11, "bold"),
            fg="#ffd700", bg="#16213e",
            bd=2, relief=tk.GROOVE,
            padx=14, pady=14,
        )
        form_frame.grid(row=0, column=0, sticky="nsew", padx=(0, 8), pady=0)

        lbl_cfg = dict(bg="#16213e", fg="#e0e0e0", font=("Helvetica", 10), anchor="w")
        entry_cfg = dict(font=("Helvetica", 10), width=18)

        # Player Number
        tk.Label(form_frame, text="Player Number (1–20):", **lbl_cfg).grid(row=0, column=0, sticky="w", pady=(0,4))
        self._player_var = tk.IntVar(value=1)
        player_spin = tk.Spinbox(
            form_frame, from_=1, to=20, textvariable=self._player_var,
            **entry_cfg, state="readonly",
        )
        player_spin.grid(row=1, column=0, sticky="ew", pady=(0, 12))

        # Game Selected
        tk.Label(form_frame, text="Game Selected:", **lbl_cfg).grid(row=2, column=0, sticky="w", pady=(0,4))
        self._game_var = tk.StringVar(value="Boul")
        game_combo = ttk.Combobox(
            form_frame, textvariable=self._game_var,
            values=list(GAMES.keys()), state="readonly",
            font=("Helvetica", 10), width=16,
        )
        game_combo.grid(row=3, column=0, sticky="ew", pady=(0, 12))

        # Amount to Bet
        tk.Label(form_frame, text="Amount to Bet ($):", **lbl_cfg).grid(row=4, column=0, sticky="w", pady=(0,4))
        self._amount_var = tk.StringVar(value="100")
        amount_entry = tk.Entry(form_frame, textvariable=self._amount_var, **entry_cfg)
        amount_entry.grid(row=5, column=0, sticky="ew", pady=(0, 12))

        # Date Played
        tk.Label(form_frame, text="Date Played (YYYY-MM-DD):", **lbl_cfg).grid(row=6, column=0, sticky="w", pady=(0,4))
        self._date_var = tk.StringVar(value=str(date.today()))
        date_entry = tk.Entry(form_frame, textvariable=self._date_var, **entry_cfg)
        date_entry.grid(row=7, column=0, sticky="ew", pady=(0, 20))

        # Place Bet button
        bet_btn = tk.Button(
            form_frame, text="  PLACE BET  ",
            font=("Helvetica", 12, "bold"),
            fg="#1a1a2e", bg="#ffd700",
            activebackground="#ffba00",
            relief=tk.RAISED, bd=3,
            cursor="hand2",
            command=self._on_place_bet,
        )
        bet_btn.grid(row=8, column=0, pady=(0, 16))

        # Last ticket info box
        info_frame = tk.LabelFrame(
            form_frame, text="  Last Ticket  ",
            font=("Helvetica", 9, "bold"),
            fg="#ffd700", bg="#16213e",
            bd=1, relief=tk.GROOVE,
            padx=8, pady=8,
        )
        info_frame.grid(row=9, column=0, sticky="ew", pady=(0, 8))

        self._ticket_labels = {}
        fields = [
            ("Ticket #:",  "ticket_number"),
            ("Player:",    "player_id"),
            ("Game:",      "game"),
            ("Bet ($):",   "amount_bet"),
            ("Points:",    "points_earned"),
            ("Date:",      "date_played"),
        ]
        for i, (label_text, key) in enumerate(fields):
            tk.Label(info_frame, text=label_text, bg="#16213e", fg="#a0a0a0",
                     font=("Helvetica", 9), anchor="w").grid(row=i, column=0, sticky="w")
            val_lbl = tk.Label(info_frame, text="—", bg="#16213e", fg="#ffffff",
                               font=("Helvetica", 9, "bold"), anchor="w")
            val_lbl.grid(row=i, column=1, sticky="w", padx=(6, 0))
            self._ticket_labels[key] = val_lbl

        # View All Tickets button
        tk.Button(
            form_frame, text="View All Tickets",
            font=("Helvetica", 10),
            fg="#ffd700", bg="#0f3460",
            activebackground="#1a4a80",
            relief=tk.FLAT, bd=1,
            cursor="hand2",
            command=self._open_ticket_history,
        ).grid(row=10, column=0, pady=(8, 0))

    # ── Right Panel (Player Table) ────────────
    def _build_right_panel(self, parent):
        right = tk.Frame(parent, bg="#1a1a2e")
        right.grid(row=0, column=1, sticky="nsew")
        right.rowconfigure(1, weight=1)
        right.columnconfigure(0, weight=1)

        tk.Label(
            right, text="All Players — Live Standings",
            font=("Helvetica", 13, "bold"),
            fg="#ffd700", bg="#1a1a2e",
        ).grid(row=0, column=0, sticky="w", pady=(0, 6))

        # Treeview frame
        tree_frame = tk.Frame(right, bg="#1a1a2e")
        tree_frame.grid(row=1, column=0, sticky="nsew")
        tree_frame.rowconfigure(0, weight=1)
        tree_frame.columnconfigure(0, weight=1)

        cols = ("Player ID", "Total Wagered ($)", "Total Points", "Current Tier")
        self._player_tree = ttk.Treeview(
            tree_frame, columns=cols, show="headings",
            height=20, selectmode="none",
        )
        for col in cols:
            self._player_tree.heading(col, text=col)
            self._player_tree.column(col, anchor="center", width=150)

        # Scrollbar
        scrollbar = ttk.Scrollbar(tree_frame, orient="vertical", command=self._player_tree.yview)
        self._player_tree.configure(yscrollcommand=scrollbar.set)
        self._player_tree.grid(row=0, column=0, sticky="nsew")
        scrollbar.grid(row=0, column=1, sticky="ns")

        # Style the treeview
        style = ttk.Style(self)
        style.theme_use("clam")
        style.configure("Treeview",
                         background="#0f3460",
                         foreground="#e0e0e0",
                         fieldbackground="#0f3460",
                         rowheight=26,
                         font=("Helvetica", 10))
        style.configure("Treeview.Heading",
                         background="#16213e",
                         foreground="#ffd700",
                         font=("Helvetica", 10, "bold"))
        style.map("Treeview", background=[("selected", "#1a4a80")])

        # Tag colours for tiers
        self._player_tree.tag_configure("Bronze",    foreground=TIER_COLORS["Bronze"])
        self._player_tree.tag_configure("Silver",    foreground=TIER_COLORS["Silver"])
        self._player_tree.tag_configure("Gold",      foreground=TIER_COLORS["Gold"])
        self._player_tree.tag_configure("highlight", background=HIGHLIGHT_BG, foreground="#000000")
        self._player_tree.tag_configure("hl_Bronze", background=HIGHLIGHT_BG, foreground=TIER_COLORS["Bronze"])
        self._player_tree.tag_configure("hl_Silver", background=HIGHLIGHT_BG, foreground=TIER_COLORS["Silver"])
        self._player_tree.tag_configure("hl_Gold",   background=HIGHLIGHT_BG, foreground=TIER_COLORS["Gold"])

    # ── Business Logic ───────────────────────
    def _on_place_bet(self):
        player_id = self._player_var.get()
        game      = self._game_var.get()
        date_str  = self._date_var.get().strip()

        # Validate amount
        try:
            amount = float(self._amount_var.get())
            if amount <= 0:
                raise ValueError
        except ValueError:
            messagebox.showerror("Invalid Input", "Please enter a positive numeric amount to bet.")
            return

        # Validate date
        try:
            date.fromisoformat(date_str)
        except ValueError:
            messagebox.showerror("Invalid Date", "Date must be in YYYY-MM-DD format.")
            return

        result = place_bet(player_id, game, amount, date_str)
        self._last_player_id = player_id
        self._last_ticket    = result

        self._update_ticket_info(result)
        self._refresh_player_table()

    def _update_ticket_info(self, info: dict):
        mapping = {
            "ticket_number": info["ticket_number"],
            "player_id":     str(info["player_id"]),
            "game":          info["game"],
            "amount_bet":    f"${info['amount_bet']:,.2f}",
            "points_earned": f"{info['points_earned']:,.2f}",
            "date_played":   info["date_played"],
        }
        for key, val in mapping.items():
            self._ticket_labels[key].config(text=val)

    def _refresh_player_table(self):
        # Clear existing rows
        for item in self._player_tree.get_children():
            self._player_tree.delete(item)

        players = fetch_all_players()
        for row in players:
            pid, wagered, points, tier = row
            is_last = (pid == self._last_player_id)
            tag = f"hl_{tier}" if is_last else tier
            self._player_tree.insert(
                "", "end",
                iid=str(pid),
                values=(
                    f"Player {pid}",
                    f"${wagered:,.2f}",
                    f"{points:,.2f}",
                    tier,
                ),
                tags=(tag,),
            )

        # Scroll to highlighted player
        if self._last_player_id:
            self._player_tree.see(str(self._last_player_id))

    # ── Ticket History Window ────────────────
    def _open_ticket_history(self):
        win = tk.Toplevel(self)
        win.title("All Ticket History")
        win.configure(bg="#1a1a2e")
        win.geometry("900x500")

        tk.Label(
            win, text="Full Ticket History",
            font=("Helvetica", 14, "bold"),
            fg="#ffd700", bg="#1a1a2e",
        ).pack(pady=10)

        frame = tk.Frame(win, bg="#1a1a2e")
        frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=(0, 10))

        cols = ("Ticket Number", "Player ID", "Game", "Amount Bet ($)", "Points Earned", "Date Played")
        tree = ttk.Treeview(frame, columns=cols, show="headings")
        col_widths = [260, 80, 70, 120, 110, 110]
        for col, w in zip(cols, col_widths):
            tree.heading(col, text=col)
            tree.column(col, anchor="center", width=w)

        vsb = ttk.Scrollbar(frame, orient="vertical",   command=tree.yview)
        hsb = ttk.Scrollbar(frame, orient="horizontal", command=tree.xview)
        tree.configure(yscrollcommand=vsb.set, xscrollcommand=hsb.set)

        tree.grid(row=0, column=0, sticky="nsew")
        vsb.grid(row=0, column=1, sticky="ns")
        hsb.grid(row=1, column=0, sticky="ew")
        frame.rowconfigure(0, weight=1)
        frame.columnconfigure(0, weight=1)

        tickets = fetch_all_tickets()
        for t in tickets:
            ticket_num, pid, game, bet, pts, dt = t
            tree.insert(
                "", "end",
                values=(ticket_num, f"Player {pid}", game, f"${bet:,.2f}", f"{pts:,.2f}", dt),
            )

        # Refresh button
        def refresh():
            for item in tree.get_children():
                tree.delete(item)
            for t in fetch_all_tickets():
                ticket_num, pid, game, bet, pts, dt = t
                tree.insert(
                    "", "end",
                    values=(ticket_num, f"Player {pid}", game, f"${bet:,.2f}", f"{pts:,.2f}", dt),
                )

        tk.Button(
            win, text="Refresh",
            font=("Helvetica", 10),
            fg="#ffd700", bg="#0f3460",
            activebackground="#1a4a80",
            relief=tk.FLAT,
            cursor="hand2",
            command=refresh,
        ).pack(pady=(0, 8))


# ──────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────
if __name__ == "__main__":
    init_db()
    app = CasinoApp()
    # Center window on screen
    app.update_idletasks()
    w, h = 1100, 680
    sw = app.winfo_screenwidth()
    sh = app.winfo_screenheight()
    app.geometry(f"{w}x{h}+{(sw - w) // 2}+{(sh - h) // 2}")
    app.mainloop()
