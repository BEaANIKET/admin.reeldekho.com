
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export const sendOtp = async (email) => {
    // Generate a random OTP


    const otp = crypto.randomInt(100000, 999999);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your Email Address',
        html: `
            <h1>Email Verification</h1>
            <p>Thank you for registering with us. Please verify your email address by using the OTP below:</p>
            <h2>${otp}</h2>
            <p>If you did not register, please ignore this email.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        return otp;
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Failed to send verification email');
    }
};
