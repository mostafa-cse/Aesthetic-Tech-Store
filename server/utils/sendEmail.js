const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Email send error:', error.message);
    // Don't throw — email failure shouldn't break API responses
  }
};

// ── Email Templates ──────────────────────────────────────────────────────

const orderConfirmationEmail = (order, user) => `
  <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0E1A; color: #F9FAFB; padding: 32px; border-radius: 12px;">
    <h1 style="color: #6C63FF;">✅ Order Confirmed!</h1>
    <p>Hi <strong>${user.name}</strong>, your order has been placed successfully.</p>
    <p><strong>Order ID:</strong> #${order._id.toString().slice(-8).toUpperCase()}</p>
    <p><strong>Total:</strong> ৳${order.totalAmount}</p>
    <p><strong>MegaCoins Earned:</strong> 🪙 ${order.megaCoinsEarned}</p>
    <p style="margin-top: 24px; color: #9CA3AF;">Thank you for shopping at <strong style="color: #00D4AA;">Aesthetic Tech Store</strong>!</p>
  </div>
`;

const returnUpdateEmail = (returnRequest, user, status) => `
  <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0E1A; color: #F9FAFB; padding: 32px; border-radius: 12px;">
    <h1 style="color: #6C63FF;">Return Request Update</h1>
    <p>Hi <strong>${user.name}</strong>, your return request status has been updated.</p>
    <p><strong>Status:</strong> <span style="color: #00D4AA;">${status.toUpperCase()}</span></p>
    ${returnRequest.adminNote ? `<p><strong>Admin Note:</strong> ${returnRequest.adminNote}</p>` : ''}
    <p style="margin-top: 24px; color: #9CA3AF;">Aesthetic Tech Store</p>
  </div>
`;

const passwordResetEmail = (name, otp) => `
  <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0E1A; color: #F9FAFB; padding: 32px; border-radius: 12px;">
    <h1 style="color: #6C63FF;">Password Reset</h1>
    <p>Hi <strong>${name}</strong>, use the OTP below to reset your password. It expires in 10 minutes.</p>
    <div style="font-size: 36px; font-weight: bold; color: #00D4AA; letter-spacing: 8px; margin: 24px 0;">${otp}</div>
    <p style="color: #9CA3AF;">If you didn't request this, ignore this email.</p>
  </div>
`;

module.exports = { sendEmail, orderConfirmationEmail, returnUpdateEmail, passwordResetEmail };
