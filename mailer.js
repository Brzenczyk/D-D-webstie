const nodemailer = require("nodemailer");
require("dotenv").config();

let transporter = null;

if (process.env.MAIL_USER && process.env.MAIL_PASS && process.env.MAIL_HOST && process.env.MAIL_PORT) {
    transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    });
} else {
    console.log("Mailtrap nie skonfigurowany, wysyłanie maili wyłączone");
}

async function sendMail(subject, text) {
    if (!transporter) return;

    try {
        await transporter.sendMail({
    from: '"D&D Planner 🎲" <no-reply@dnd-planner.local>',
    to: process.env.MAIL_TO,   // teraz odbiorca z .env
    subject,
    text
});

        console.log("Mail wysłany:", subject);
    } catch (err) {
        console.error("MAIL ERROR:", err.message);
    }
}

module.exports = { sendMail };
