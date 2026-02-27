// Email utility for sending authentication emails using Resend
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.FROM_EMAIL || 'auth@yourapp.com'

interface EmailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const { to, subject, text, html } = options

  // For development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.log('\n📧 Email would be sent:')
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('Text:', text)
    console.log('---')
  }

  // Send email via Resend
  // Using void to not await and prevent timing attacks as per Better Auth docs
  void resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    text,
    html,
  })
}

// Email templates for Better Auth

export function getVerificationEmailTemplate(url: string): {
  text: string
  html: string
} {
  const text = `Please verify your email address by clicking the link below:\n\n${url}\n\nIf you did not create an account, you can ignore this email.`

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Verify your email address</h2>
      <p>Thank you for signing up! Please click the button below to verify your email address:</p>
      <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 16px 0;">Verify Email</a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${url}</p>
      <p style="color: #666; font-size: 14px;">If you did not create an account, you can ignore this email.</p>
    </div>
  `

  return { text, html }
}

export function getPasswordResetTemplate(url: string): {
  text: string
  html: string
} {
  const text = `You requested a password reset. Click the link below to reset your password:\n\n${url}\n\nIf you did not request this, you can ignore this email.`

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Reset your password</h2>
      <p>You requested a password reset. Click the button below to set a new password:</p>
      <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 16px 0;">Reset Password</a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${url}</p>
      <p style="color: #666; font-size: 14px;">If you did not request this, you can ignore this email.</p>
    </div>
  `

  return { text, html }
}
