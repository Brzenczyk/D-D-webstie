require("dotenv").config({ override: true });
const express = require("express");
const db = require("./db");
const { sendMail } = require("./mailer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

/* ===== PLAYERS ===== */
app.get("/api/players", (req, res) => {
    db.all("SELECT * FROM players", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post("/api/players", (req, res) => {
    const { id, name, email, emoji } = req.body;
    if (!id || !name) return res.status(400).json({ error: "Brak id lub imienia" });

    db.run(`
        INSERT INTO players (id, name, email, emoji)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            email = excluded.email,
            emoji = excluded.emoji
    `, [id, name, email || null, emoji || "🧙"], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Gracz zapisany" });
    });
});

/* ===== DATES ===== */
app.get("/api/dates", (req, res) => {
    db.all("SELECT id, session_date, votes, is_confirmed FROM dates ORDER BY votes DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        // mapujemy session_date → date
        const mapped = rows.map(r => ({
            id: r.id,
            date: r.session_date,
            votes: r.votes,
            is_confirmed: r.is_confirmed
        }));
        res.json(mapped);
    });
});


app.post("/api/dates", (req, res) => {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: "Brak daty" });

    db.run("INSERT INTO dates (session_date) VALUES (?)", [date], async (err) => {
        if (err) return res.status(400).json({ error: "Data już istnieje!" });
        await sendMail("📅 Nowy termin", `Dodano nową datę: ${date}`);
        res.json({ message: "Data dodana" });
    });
});

/* ===== VOTES ===== */
app.get("/api/votes/:playerId", (req, res) => {
    const playerId = req.params.playerId;
    db.all(`
        SELECT d.session_date
        FROM votes v
        JOIN dates d ON v.date_id = d.id
        WHERE v.player_id = ?
    `, [playerId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => r.session_date));
    });
});

app.post("/api/vote", async (req, res) => {
    try {
        const { playerId, date } = req.body;
        if (!playerId || !date) return res.status(400).json({ error: "Brak danych" });

        // Pobranie ID daty
        db.get("SELECT id FROM dates WHERE session_date = ?", [date], async (err, dateRow) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!dateRow) return res.status(400).json({ error: "Data nie istnieje" });

            // Zapis głosu
            db.run("INSERT INTO votes (player_id, date_id) VALUES (?, ?)", [playerId, dateRow.id], async (err) => {
                if (err) return res.status(400).json({ error: "Już głosowałeś!" });

                // Aktualizacja liczby głosów
                db.run("UPDATE dates SET votes = votes + 1 WHERE id = ?", [dateRow.id]);

                // Pobranie danych gracza
                db.get("SELECT name, email FROM players WHERE id = ?", [playerId], async (err, player) => {
                    if (err) console.error("Błąd pobrania gracza do maila:", err.message);

                    const recipient = player?.email || process.env.MAIL_USER;
                    const playerName = player?.name || "Nieznany gracz";

                    // Wyślij maila o nowym głosie
                    try {
                        await sendMail(
                            "🗳️ Nowy głos w planowaniu sesji D&D",
                            `${playerName} zagłosował na ${date}`,
                            recipient
                        );
                    } catch (mailErr) {
                        console.error("Błąd wysyłania maila:", mailErr.message);
                    }

                    res.json({ message: "Głos zapisany" });
                });
            });
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


/* ===== ADMIN: USUWANIE / ZATWIERDZANIE DAT ===== */
app.post("/api/dates/delete", (req, res) => {
    const { dateId, pin } = req.body;
    if (pin !== "1234") return res.status(403).json({ error: "Nieprawidłowy PIN" });

    db.run("DELETE FROM dates WHERE id = ?", [dateId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        db.run("DELETE FROM votes WHERE date_id = ?", [dateId]);
        res.json({ message: "Data usunięta" });
    });
});

app.post("/api/dates/confirm", (req, res) => {
    const { dateId, pin } = req.body;
    if (pin !== "1234") return res.status(403).json({ error: "Nieprawidłowy PIN" });

    db.run("UPDATE dates SET is_confirmed = 0", [], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        db.run("UPDATE dates SET is_confirmed = 1 WHERE id = ?", [dateId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Data zatwierdzona" });
        });
    });
});

/* ===== DATES + VOTERS ===== */
app.get("/api/date-votes", (req, res) => {
    db.all(`
        SELECT d.session_date, p.name, p.emoji
        FROM votes v
        JOIN dates d ON v.date_id = d.id
        JOIN players p ON v.player_id = p.id
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const map = {};
        rows.forEach(r => {
            if (!map[r.session_date]) map[r.session_date] = [];
            map[r.session_date].push({ name: r.name, emoji: r.emoji });
        });
        res.json(map);
    });
});

/* ===== START ===== */
app.listen(PORT, () => console.log(`Serwer działa na http://localhost:${PORT}`));
