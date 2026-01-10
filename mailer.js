const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

async function sendMail(to, subject, text) {
    try {
        await transporter.sendMail({
            from: '"D&D Planner 🎲" <no-reply@dnd-planner.local>',
            to,
            subject,
            text
        });
    } catch (err) {
        console.error("MAIL ERROR:", err.message);
        // ❗ NIE RZUCAJEMY błędu dalej
    }
}

module.exports = { sendMail };
