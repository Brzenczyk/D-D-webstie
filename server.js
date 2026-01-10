require("dotenv").config({ override: true });
const express = require("express");
const db = require("./db");
const { sendMail } = require("./mailer");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PIN = process.env.ADMIN_PIN || "1234";

// Middleware
app.use(express.json());
app.use(express.static("public"));

function isAdminRequest(req) {
    return req.headers["x-admin"] === "true";
}

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

app.post("/api/vote", (req, res) => {
    const { playerId, date } = req.body;
    if (!playerId || !date) return res.status(400).json({ error: "Brak danych" });

    db.get("SELECT id FROM dates WHERE session_date = ?", [date], (err, dateRow) => {
        if (!dateRow) return res.status(400).json({ error: "Data nie istnieje" });

        db.run("INSERT INTO votes (player_id, date_id) VALUES (?, ?)", [playerId, dateRow.id], async (err) => {
            if (err) return res.status(400).json({ error: "Już głosowałeś!" });

            db.run("UPDATE dates SET votes = votes + 1 WHERE id = ?", [dateRow.id]);

            // Wyślij maila do Mailtrapa i opcjonalnie do użytkownika (jeśli podał email)
            db.get("SELECT email, name FROM players WHERE id = ?", [playerId], async (err, player) => {
                if (player?.email || player?.name) {
                    let recipients = [process.env.MAIL_TO]; // zawsze Mailtrap
                    if (player.email) recipients.push(player.email);

                    await sendMail(
                        "🗳️ Nowy głos w planowaniu sesji D&D",
                        `${player.name || "Nieznany gracz"} zagłosował na ${date}`,
                        recipients
                    );
                }
                res.json({ message: "Głos zapisany" });
            });
        });
    });
});

/* ===== ADMIN ===== */
app.post("/api/admin/login", (req, res) => {
    const { pin } = req.body;
    if (pin === ADMIN_PIN) return res.json({ ok: true });
    return res.status(403).json({ error: "Zły PIN" });
});

app.post("/api/admin/date/:id/delete", (req, res) => {
    if (!isAdminRequest(req)) return res.status(403).json({ error: "Brak uprawnień admina" });

    db.run("DELETE FROM dates WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        db.run("DELETE FROM votes WHERE date_id = ?", [req.params.id]);
        res.json({ ok: true });
    });
});

app.post("/api/admin/date/:id/confirm", (req, res) => {
    if (!isAdminRequest(req)) return res.status(403).json({ error: "Brak uprawnień admina" });

    db.run("UPDATE dates SET is_confirmed = 0", [], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        db.run("UPDATE dates SET is_confirmed = 1 WHERE id = ?", [req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ok: true });
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

/* ===== START SERVER ===== */
app.listen(PORT, () => console.log(`Serwer działa na http://localhost:${PORT}`));
