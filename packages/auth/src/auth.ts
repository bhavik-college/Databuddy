import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { customSession, multiSession, jwt, twoFactor, captcha, organization, emailOTP } from "better-auth/plugins";
import { getSessionCookie } from "better-auth/cookies";
import { db } from "@databuddy/db";
import { sendEmail } from "@databuddy/email";

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
        // emailOTP({
        //     sendVerificationOnSignUp: true,
        //     disableSignUp: true,
        //     generateOTP: () => Math.floor(100000 + Math.random() * 900000).toString(),
        //     async sendVerificationOTP({ email, otp, type }: { email: string, otp: string, type: 'sign-in' | 'email-verification' | 'forget-password' }) {
        //         try {
        //             if (type === 'sign-in') {
        //                 await sendEmail('verification', {
        //                     to: email,
        //                     data: { 
        //                         userName: email.split('@')[0],
        //                         verificationUrl: `https://app.databuddy.cc/verify?code=${otp}`,
        //                         companyName: 'Databuddy',
        //                         expiryHours: 24
        //                     },
        //                 });
        //             } else if (type === 'email-verification') {
        //                 await sendEmail('verification', {
        //                     to: email,
        //                     data: { 
        //                         userName: email.split('@')[0],
        //                         verificationUrl: `https://app.databuddy.cc/verify?code=${otp}`,
        //                         companyName: 'Databuddy',
        //                         expiryHours: 24
        //                     },
        //                 });
        //             } else if (type === 'forget-password') {
        //                 await sendEmail('password-reset', {
        //                     to: email,
        //                     data: { 
        //                         userName: email.split('@')[0],
        //                         resetUrl: `https://app.databuddy.cc/reset-password?code=${otp}`,
        //                         companyName: 'Databuddy',
        //                         expiryMinutes: 30
        //                     },
        //                 });
        //             }
        //         } catch (error) {
        //             console.error('Failed to send email', error);
        //         }
        //     }
        // }),
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