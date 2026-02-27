import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import {
  sendEmail,
  getVerificationEmailTemplate,
  getPasswordResetTemplate,
} from "./email";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url, token }, request) => {
      const { text, html } = getPasswordResetTemplate(url);
      void sendEmail({
        to: user.email,
        subject: "Reset your password",
        text,
        html,
      });
    },
    onPasswordReset: async ({ user }, request) => {
      // Optional: Add post-password reset logic here
      console.log(`Password for user ${user.email} has been reset.`);
    },
    resetPasswordTokenExpiresIn: 3600, // 1 hour
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      const { text, html } = getVerificationEmailTemplate(url);
      void sendEmail({
        to: user.email,
        subject: "Verify your email address",
        text,
        html,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
});
