const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database.db");

// Tworzymy tabele jeśli nie istnieją
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS players (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT,
            emoji TEXT DEFAULT "🎲",
            is_dm INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS dates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_date TEXT UNIQUE,
            votes INTEGER DEFAULT 0,
            is_confirmed INTEGER DEFAULT 0
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS votes (
            player_id TEXT,
            date_id INTEGER,
            PRIMARY KEY (player_id, date_id)
        )
    `);
});

module.exports = db;
