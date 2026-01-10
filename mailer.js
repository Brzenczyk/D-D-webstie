const nodemailer = require("nodemailer");

let transporter = null;

if (process.env.MAIL_USER && process.env.MAIL_PASS) {
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

async function sendMail(subject, text, recipients = [process.env.MAIL_TO]) {
    if (!transporter || !recipients.length) return;

    try {
        await transporter.sendMail({
            from: '"D&D Planner 🎲" <no-reply@dnd-planner.local>',
            to: recipients.join(","), // Mailtrap + ewentualnie użytkownik
            subject,
            text
        });
        console.log("Mail wysłany do:", recipients.join(","));
    } catch (err) {
        console.error("MAIL ERROR:", err.message);
    }
}

module.exports = { sendMail };
