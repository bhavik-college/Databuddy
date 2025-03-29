import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { customSession, multiSession, jwt, twoFactor, captcha, organization, emailOTP } from "better-auth/plugins";
import { getSessionCookie } from "better-auth/cookies";
import { db } from "@databuddy/db";
import type { EmailClient } from "@databuddy/email";

// Use dynamic import to prevent client-side bundling of emailjs
let emailClient: EmailClient | null = null;

// This function will be called only on the server side
export async function getEmailClient() {
  if (typeof window !== 'undefined') {
    console.error('Email client cannot be used on the client side');
    return null;
  }

  if (!emailClient) {
    // Dynamic import to prevent bundling on client
    const { createEmailClient } = await import('@databuddy/email');
    emailClient = await createEmailClient({
      user: process.env.SMTP_USER as string,
      password: process.env.SMTP_PASSWORD as string,
      host: process.env.SMTP_HOST as string,
      port: Number(process.env.SMTP_PORT) as number,
      ssl: process.env.SMTP_SSL === 'true',
      defaultFrom: process.env.SMTP_FROM as string,
    });
  }
  return emailClient;
}

export const canManageUsers = (role: string) => {
  return role === 'ADMIN'
}

export const getSession = async (request: any) => {
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return null;
  }
  return sessionCookie;
}


export const auth = betterAuth({
    database: prismaAdapter(db, {
        provider: "postgresql",
    }),
    appName: "databuddy.cc",
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        },
    },
    emailAndPassword: {
        enabled: true,
    },
    jwt: {
        enabled: true,
    },
    api: {
        enabled: true,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 30, // 30 days
        updateAge: 60 * 60 * 24, // 1 day
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60 // 5 minutes
        }
    },
    plugins: [
        customSession(async ({ user, session }) => {
            // Fetch the user's role from the database
            const dbUser = await db.user.findUnique({
                where: { id: user.id },
                select: { role: true, emailVerified: true }
            });
            
            return {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    emailVerified: dbUser?.emailVerified || false,
                    role: dbUser?.role || 'USER',
                },
                session: {
                    id: session.id,
                    role: dbUser?.role || 'USER',
                    expiresAt: session.expiresAt,
                    createdAt: session.createdAt,
                    updatedAt: session.updatedAt,
                    ipAddress: session.ipAddress,
                    userAgent: session.userAgent,
                },
            }
        }),

        twoFactor(),
        multiSession(),
        jwt(),
        emailOTP({
            sendVerificationOnSignUp: true,
            disableSignUp: true,
            generateOTP: () => Math.floor(100000 + Math.random() * 900000).toString(),
            async sendVerificationOTP({ email, otp, type }: { email: string, otp: string, type: 'sign-in' | 'email-verification' | 'forget-password' }) {
                // Dynamically import and initialize email client only when needed
                const emailClientInstance = await getEmailClient();
                
                if (!emailClientInstance) {
                    console.error('Failed to initialize email client');
                    return;
                }
                
                if (type === 'sign-in') {
                    await emailClientInstance.sendEmail({
                        to: email,
                        subject: 'Sign in OTP',
                        template: 'verification',
                        data: { 
                            otp,
                            userName: email.split('@')[0],
                            verificationUrl: `https://app.databuddy.cc/verify?code=${otp}`,
                            companyName: 'Databuddy'
                        },
                    });
                } else if (type === 'email-verification') {
                    await emailClientInstance.sendEmail({
                        to: email,
                        subject: 'Email Verification OTP',
                        template: 'verification',
                        data: { 
                            otp,
                            userName: email.split('@')[0],
                            verificationUrl: `https://app.databuddy.cc/verify?code=${otp}`,
                            companyName: 'Databuddy'
                        },
                    });
                } else if (type === 'forget-password') {
                    await emailClientInstance.sendEmail({
                        to: email,
                        subject: 'Password Reset OTP',
                        template: 'password-reset',
                        data: { 
                            otp,
                            userName: email.split('@')[0],
                            resetUrl: `https://app.databuddy.cc/reset-password?code=${otp}`,
                            companyName: 'Databuddy'
                        },
                    });
                }
            }
        }),
        organization({
            teams: {
                enabled: true,
            },
            allowUserToCreateOrganization: true,
            organizationLimit: 1,
            membershipLimit: 100,
        }),
        // captcha({
        //     provider: "cloudflare-turnstile",
        //     secretKey: process.env.RECAPTCHA_SECRET_KEY as string,
        // })
    ]
})