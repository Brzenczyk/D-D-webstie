const nodemailer = require("nodemailer");

let transporter = null;

if (process.env.MAIL_USER && process.env.MAIL_PASS) {
    transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,       // np. sandbox.smtp.mailtrap.io
        port: Number(process.env.MAIL_PORT) || 2525,
        secure: false,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    });
}

async function sendMail(subject, text, recipients = [process.env.MAIL_TO]) {
    if (!transporter) return;
    try {
        await transporter.sendMail({
            from: '"D&D Planner 🎲" <no-reply@dnd-planner.local>',
            to: "test@mailtrap.io",  // Mailtrap + gracz jeśli poda email
            subject,
            text
        });
        console.log("Mail wysłany do:", recipients.join(","));
    } catch (err) {
        console.error("MAIL ERROR:", err.message);
    }
}

module.exports = { sendMail };
