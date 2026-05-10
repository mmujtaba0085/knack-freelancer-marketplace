// config/mailer.js — Nodemailer wrapper
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendResetEmail = async (to, name, link) => {
  await transporter.sendMail({
    from: `"Knack" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Reset your Knack password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#FAF7F2;padding:40px;border-radius:12px">
        <div style="font-family:Georgia,serif;font-size:28px;color:#FF6B2C;margin-bottom:24px">Knack.</div>
        <h2 style="color:#14110D;margin:0 0 16px">Hi ${name},</h2>
        <p style="color:#3A352D;line-height:1.6">We received a request to reset your password. Click below to set a new one:</p>
        <a href="${link}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:#14110D;color:#FAF7F2;text-decoration:none;border-radius:999px;font-weight:500">Reset my password</a>
        <p style="color:#6B6358;font-size:13px">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
};
