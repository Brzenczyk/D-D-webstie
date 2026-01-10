const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

async function sendMail(subject, text) {
    await transporter.sendMail({
        from: '"D&D Planner 🎲" <no-reply@dnd-planner.local>',
        to: "test@mailtrap.io", // Mailtrap
        subject,
        text
    });
}

module.exports = { sendMail };
