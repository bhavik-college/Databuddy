import { betterAuth } from "better-auth";
import { customSession, multiSession, twoFactor, emailOTP, magicLink, organization } from "better-auth/plugins";
import { getSessionCookie } from "better-auth/cookies";
import { db, eq, user } from "@databuddy/db";
import { Resend } from "resend";
import { getRedisCache } from "@databuddy/redis";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { ac, owner, admin, member, viewer } from "./permissions";
import { logger } from "@databuddy/shared";
import { VerificationEmail, OtpEmail, MagicLinkEmail, InvitationEmail, ResetPasswordEmail } from "@databuddy/email";

function isProduction() {
    return process.env.NODE_ENV === 'production';
}

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    appName: "databuddy.cc",
    onAPIError: {
        throw: false,
        onError: (error, ctx) => {
            if (error instanceof Error) {
                logger.exception(error, ctx as Record<string, unknown>);
            } else {
                logger.error("Auth API Error", "An unknown error occurred", {
                    error,
                    ...(ctx as Record<string, unknown>)
                });
            }
        },
        errorURL: "/auth/error"
    },
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
        sendResetPasswordEmail: async ({ user, url }: { user: any, url: string }) => {
            const resend = new Resend(process.env.RESEND_API_KEY as string);
            await resend.emails.send({
                from: 'noreply@databuddy.cc',
                to: user.email,
                subject: 'Reset your password',
                react: ResetPasswordEmail({ url })
            });
        }
    },
    emailVerification: {
        sendOnSignUp: true,
        sendVerificationOnSignUp: true,
        disableSignUp: true,
        sendVerificationOnSignIn: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }: { user: any, url: string }) => {
            logger.info('Email Verification', `Sending verification email to ${user.email}`, { url });
            const resend = new Resend(process.env.RESEND_API_KEY as string);
            await resend.emails.send({
                from: 'noreply@databuddy.cc',
                to: user.email,
                subject: 'Verify your email',
                react: VerificationEmail({ url })
            });
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
        set: async (key, value, ttl = 60 * 60 * 24) => {
            await getRedisCache()?.setex(key, ttl, value);
        },
        delete: async (key) => {
            await getRedisCache()?.del(key);
        },
    },
    plugins: [
        emailOTP({
            async sendVerificationOTP({ email, otp, type }) {
                logger.info('Email OTP', `Sending OTP to ${email} of type ${type}`);
                const resend = new Resend(process.env.RESEND_API_KEY as string);
                await resend.emails.send({
                    from: 'noreply@databuddy.cc',
                    to: email,
                    subject: 'Your verification code',
                    react: OtpEmail({ otp })
                })
            },
        }),
        magicLink({
            sendMagicLink: async ({ email, token, url }) => {
                logger.info('Magic Link', `Sending magic link to ${email}`, { url });
                const resend = new Resend(process.env.RESEND_API_KEY as string);
                await resend.emails.send({
                    from: 'noreply@databuddy.cc',
                    to: email,
                    subject: 'Login to Databuddy',
                    react: MagicLinkEmail({ url })
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
                logger.info(
                    'Organization Invitation',
                    `Inviting ${email} to ${organization.name}`,
                    { inviter: inviter.user.name, organizationId: organization.id }
                );
                const invitationLink = `https://app.databuddy.cc/invitations/${invitation.id}`;
                const resend = new Resend(process.env.RESEND_API_KEY as string);
                await resend.emails.send({
                    from: 'noreply@databuddy.cc',
                    to: email,
                    subject: `You're invited to join ${organization.name}`,
                    react: InvitationEmail({ inviterName: inviter.user.name, organizationName: organization.name, invitationLink: invitationLink })
                });
            }
        }),
    ]
})

export type User = (typeof auth)["$Infer"]["Session"]["user"];
export type Session = (typeof auth)["$Infer"]["Session"];
