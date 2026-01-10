const sqlite3 = require("sqlite3").verbose();

// na Renderze zapisujemy do /tmp/database.db
const dbFile = process.env.RENDER ? "/tmp/database.db" : "./database.db";
const db = new sqlite3.Database(dbFile);

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
