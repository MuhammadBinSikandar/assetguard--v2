import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'mock';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@assetguard.com';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'AssetGuard';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Mock email provider for development
 * Logs emails to console and writes to temp directory
 */
class MockEmailProvider {
  async send(options: EmailOptions): Promise<void> {
    console.log('📧 [MOCK EMAIL]');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('---');

    // Write to file for easy review (non-blocking, don't wait)
    this.writeToFile(options).catch((error) => {
      console.error('Failed to write mock email to file:', error);
    });
  }

  private async writeToFile(options: EmailOptions): Promise<void> {
    try {
      // Use OS temp directory for cross-platform compatibility
      const mockEmailDir = path.join(os.tmpdir(), 'assetguard-mock-emails');
      await fs.mkdir(mockEmailDir, { recursive: true });

      const filename = `${Date.now()}-${options.to.replace(/[^a-z0-9]/gi, '_')}.txt`;
      const filepath = path.join(mockEmailDir, filename);

      const content = `
To: ${options.to}
Subject: ${options.subject}
Date: ${new Date().toISOString()}

${options.text || options.html}
`;

      await fs.writeFile(filepath, content);
      console.log(`📧 Email written to: ${filepath}`);
    } catch (error) {
      console.error('Failed to write mock email to file:', error);
    }
  }
}

/**
 * Resend email provider
 */
class ResendEmailProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('RESEND_API_KEY is required for Resend provider');
    }
  }

  async send(options: EmailOptions): Promise<void> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Resend API error: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Failed to send email via Resend:', error);
      throw error;
    }
  }
}

/**
 * SendGrid email provider
 */
class SendGridEmailProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || process.env.EMAIL_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('SENDGRID_API_KEY is required for SendGrid provider');
    }
  }

  async send(options: EmailOptions): Promise<void> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: options.to }],
            },
          ],
          from: {
            email: EMAIL_FROM,
            name: EMAIL_FROM_NAME,
          },
          subject: options.subject,
          content: [
            {
              type: 'text/html',
              value: options.html,
            },
            ...(options.text
              ? [
                  {
                    type: 'text/plain',
                    value: options.text,
                  },
                ]
              : []),
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`SendGrid API error: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Failed to send email via SendGrid:', error);
      throw error;
    }
  }
}

/**
 * Nodemailer SMTP provider
 */
class NodemailerEmailProvider {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true' || process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || process.env.SMTP_USER || '',
        pass: process.env.EMAIL_PASSWORD || process.env.SMTP_PASS || '',
      },
    });
  }

  async send(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
    } catch (error) {
      console.error('Failed to send email via Nodemailer:', error);
      throw error;
    }
  }
}

/**
 * Get email provider based on configuration
 */
function getEmailProvider() {
  switch (EMAIL_PROVIDER) {
    case 'resend':
      return new ResendEmailProvider();
    case 'sendgrid':
      return new SendGridEmailProvider();
    case 'nodemailer':
      return new NodemailerEmailProvider();
    case 'mock':
    default:
      return new MockEmailProvider();
  }
}

const emailProvider = getEmailProvider();

/**
 * Send email using configured provider
 * @param options - Email options
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  return emailProvider.send(options);
}

/**
 * Send email verification OTP
 * @param to - Recipient email
 * @param otpCode - 6-digit OTP code
 */
export async function sendVerificationOTP(
  to: string,
  otpCode: string
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">AssetGuard</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
    <p>Thank you for registering with AssetGuard! Please use the verification code below to complete your registration:</p>
    <div style="text-align: center; margin: 30px 0;">
      <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; display: inline-block;">
        <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
          ${otpCode}
        </div>
      </div>
    </div>
    <p style="text-align: center; color: #666; font-size: 14px;">
      Enter this code in the verification page to activate your account.
    </p>
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      This code will expire in 10 minutes. If you didn't create an account with AssetGuard, please ignore this email.
    </p>
  </div>
</body>
</html>
`;

  const text = `
Verify Your Email Address

Thank you for registering with AssetGuard!

Your verification code is: ${otpCode}

Enter this code in the verification page to activate your account.

This code will expire in 10 minutes. If you didn't create an account with AssetGuard, please ignore this email.
`;

  await sendEmail({
    to,
    subject: 'Verify Your Email - AssetGuard',
    html,
    text,
  });
}

/**
 * Send email verification email (legacy URL-based)
 * @param to - Recipient email
 * @param verificationToken - Verification token
 */
export async function sendVerificationEmail(
  to: string,
  verificationToken: string
): Promise<void> {
  const verificationUrl = `${APP_URL}/verify-email?token=${verificationToken}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">AssetGuard</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
    <p>Thank you for registering with AssetGuard! Please verify your email address by clicking the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="background: white; padding: 10px; border-radius: 5px; word-break: break-all;">
      ${verificationUrl}
    </p>
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      This link will expire in 24 hours. If you didn't create an account with AssetGuard, please ignore this email.
    </p>
  </div>
</body>
</html>
`;

  const text = `
Verify Your Email Address

Thank you for registering with AssetGuard! Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours. If you didn't create an account with AssetGuard, please ignore this email.
`;

  await sendEmail({
    to,
    subject: 'Verify Your Email - AssetGuard',
    html,
    text,
  });
}

/**
 * Send password reset email
 * @param to - Recipient email
 * @param resetToken - Password reset token
 */
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password/${resetToken}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">AssetGuard</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="background: white; padding: 10px; border-radius: 5px; word-break: break-all;">
      ${resetUrl}
    </p>
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
    </p>
  </div>
</body>
</html>
`;

  const text = `
Reset Your Password

We received a request to reset your password. Click the link below to create a new password:

${resetUrl}

This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
`;

  await sendEmail({
    to,
    subject: 'Reset Your Password - AssetGuard',
    html,
    text,
  });
}

/**
 * Send security alert email
 * @param to - Recipient email
 * @param message - Alert message
 */
export async function sendSecurityAlertEmail(
  to: string,
  message: string
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Alert</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #dc2626; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🔒 Security Alert</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #dc2626; margin-top: 0;">Security Alert for Your Account</h2>
    <p>${message}</p>
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      If this wasn't you, please reset your password immediately and contact support.
    </p>
  </div>
</body>
</html>
`;

  const text = `
Security Alert for Your Account

${message}

If this wasn't you, please reset your password immediately and contact support.
`;

  await sendEmail({
    to,
    subject: '🔒 Security Alert - AssetGuard',
    html,
    text,
  });
}
