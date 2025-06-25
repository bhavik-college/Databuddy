import { betterAuth } from "better-auth";
import { customSession, multiSession, twoFactor, emailOTP, magicLink, organization } from "better-auth/plugins";
import { getSessionCookie } from "better-auth/cookies";
import { db, eq } from "@databuddy/db";
import { user } from "@databuddy/db";
import { Resend } from "resend";
import { getRedisCache } from "@databuddy/redis";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { ac, owner, admin, member, viewer } from "./permissions";

// Helper to check NODE_ENV
function isProduction() {
    return process.env.NODE_ENV === 'production';
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
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    appName: "databuddy.cc",
    advanced: {
        crossSubDomainCookies: {
            enabled: isProduction(),
            domain: ".databuddy.cc"
        },
        cookiePrefix: "databuddy",
        useSecureCookies: isProduction()
    },
    trustedOrigins: [
        'https://databuddy.cc',
        'https://app.databuddy.cc',
        'https://api.databuddy.cc'
    ],
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
        minPasswordLength: 8,
        maxPasswordLength: 32,
        autoSignIn: false,
        requireEmailVerification: true,
        sendResetPasswordEmail: true,
    },
    emailVerification: {
        sendOnSignUp: true,
        sendVerificationOnSignUp: true,
        disableSignUp: true,
        sendVerificationOnSignIn: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }: { user: any, url: string }) => {
            const resend = new Resend(process.env.RESEND_API_KEY as string);
            const email = await resend.emails.send({
                from: 'noreply@databuddy.cc',
                to: user.email,
                subject: 'Verify your email',
                html: `<p>Click <a href="${url}">here</a> to verify your email</p>`
            });
            console.log(email);
        }
    },
    session: {
        expiresIn: 60 * 60 * 24 * 30, // 30 days
        updateAge: 60 * 60 * 24, // 1 day
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60 // 5 minutes
        }
    },
    secondaryStorage: {
        get: async (key) => {
            const value = await getRedisCache()?.get(key);
            return value ? value : null;
        },
        set: async (key, value, ttl) => {
            if (ttl) await getRedisCache()?.setex(key, ttl, value);
            else await getRedisCache()?.set(key, value);
        },
        delete: async (key) => {
            await getRedisCache()?.del(key);
        },
    },
    plugins: [
        emailOTP({
            async sendVerificationOTP({ email, otp, type }) {
                const resend = new Resend(process.env.RESEND_API_KEY as string);
                await resend.emails.send({
                    from: 'noreply@databuddy.cc',
                    to: email,
                    subject: 'Verify your email',
                    html: `<p>Your verification code is ${otp}</p>`
                })
            },
        }),
        magicLink({
            sendMagicLink: async ({ email, token, url }) => {
                // console.log(url);
                const resend = new Resend(process.env.RESEND_API_KEY as string);
                await resend.emails.send({
                    from: 'noreply@databuddy.cc',
                    to: email,
                    subject: 'Login to Databuddy',
                    html: `<p>Click <a href="${url}">here</a> to verify your email</p>`
                });
            }
        }),
        twoFactor(),
        multiSession(),
        // captcha({
        //     provider: "cloudflare-turnstile",
        //     secretKey: process.env.RECAPTCHA_SECRET_KEY as string,
        // })
        nextCookies(),
        customSession(async ({ user: sessionUser, session }) => {
            const [dbUser] = await db.query.user.findMany({
                where: eq(user.id, session.userId),
                columns: {
                    role: true,
                }
            });
            return {
                role: dbUser?.role,
                user: {
                    ...sessionUser,
                    role: dbUser?.role,
                },
                session
            };
        }),
        organization({
            creatorRole: "owner",
            teams: {
                enabled: false,
            },
            ac,
            roles: {
                owner,
                admin,
                member,
                viewer,
            },
            sendInvitationEmail: async ({ email, inviter, organization, invitation }) => {
                const resend = new Resend(process.env.RESEND_API_KEY as string);
                const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/invitations/${invitation.id}`;
                await resend.emails.send({
                    from: 'noreply@databuddy.cc',
                    to: email,
                    subject: `You're invited to join ${organization.name}`,
                    html: `
                        <p>Hi there!</p>
                        <p>${inviter.user.name} has invited you to join <strong>${organization.name}</strong>.</p>
                        <p><a href="${invitationLink}">Click here to accept the invitation</a></p>
                        <p>This invitation will expire in 48 hours.</p>
                    `
                });
            }
        }),
    ]
})

export type User = (typeof auth)["$Infer"]["Session"]["user"];
export type Session = (typeof auth)["$Infer"]["Session"];
