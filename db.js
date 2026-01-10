const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// używamy /tmp/database.db, albo fallback na lokalną dla testów
const dbPath = process.env.DATABASE_PATH || path.join("/tmp", "database.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // tabela players
    db.run(`
        CREATE TABLE IF NOT EXISTS players (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT,
            emoji TEXT DEFAULT '🧙',
            is_dm INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // tabela dates
    db.run(`
        CREATE TABLE IF NOT EXISTS dates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_date TEXT UNIQUE,
            votes INTEGER DEFAULT 0,
            is_confirmed INTEGER DEFAULT 0
        )
    `);

    // tabela votes
    db.run(`
        CREATE TABLE IF NOT EXISTS votes (
            player_id TEXT,
            date_id INTEGER,
            PRIMARY KEY (player_id, date_id)
        )
    `);
});

module.exports = db;
