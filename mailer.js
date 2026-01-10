const nodemailer = require("nodemailer");

let transporter;

if (!process.env.MAIL_USER) {
    console.log("Mail nie skonfigurowany, wysyłanie maili wyłączone");
    transporter = null;
} else {
    transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        secure: false,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    });
}

async function sendMail(subject, text) {
    if (!transporter) return;
    try {
        await transporter.sendMail({
            from: '"D&D Planner 🎲" <no-reply@dnd-planner.local>',
            to: process.env.MAIL_USER,
            subject,
            text
        });
    } catch (err) {
        console.error("MAIL ERROR:", err.message);
    }
}

module.exports = { sendMail };
