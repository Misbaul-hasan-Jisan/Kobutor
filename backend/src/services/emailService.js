// backend/services/emailService.js
import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // or your email service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // Use app password for Gmail
    },
  });
};

export const sendVerificationEmail = async (email, token, username) => {
  try {
    const transporter = createTransporter();
    
    // Include both token AND email in the URL
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
    
    const mailOptions = {
      from: "Kobutor",
      to: email,
      subject: 'Verify Your Kobutor Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to Kobutor! 🕊️</h2>
          <p>Hello ${username},</p>
          <p>Thank you for signing up for Kobutor. Please verify your email address to start using your account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account with Kobutor, please ignore this email.</p>
          <br/>
          <p>Happy messaging!<br/>The Kobutor Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};