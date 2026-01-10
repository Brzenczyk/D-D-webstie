const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || "sandbox.smtp.mailtrap.io",
    port: Number(process.env.MAIL_PORT) || 2525,
    secure: false,
    auth: {
        user: process.env.MAIL_USER, // Twój username Mailtrap
        pass: process.env.MAIL_PASS  // Twój password Mailtrap
    }
});

async function sendMail(subject, text) {
    try {
        await transporter.sendMail({
            from: '"D&D Planner 🎲" <no-reply@dnd-planner.local>',
            to: process.env.MAIL_USER, // zawsze Mailtrap
            subject,
            text
        });
    } catch (err) {
        console.error("MAIL ERROR:", err.message);
    }
}

module.exports = { sendMail };
