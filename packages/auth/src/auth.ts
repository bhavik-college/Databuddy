import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { customSession, multiSession, jwt, twoFactor, captcha, organization, emailOTP } from "better-auth/plugins";
import { getSessionCookie } from "better-auth/cookies";
import { db } from "@databuddy/db";
// import { Resend } from "resend";

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
    cookie: {
        domain: process.env.NODE_ENV === 'production' ? ".databuddy.cc" : undefined,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "lax"
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            mapProfileToUser: async (...args: any[]) => {
                console.log(args);
                if (args[1]) {
                    return args[1];
                }
                return null;
            }
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID as string,
            
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        },
    },
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        maxPasswordLength: 100,
        autoSignIn: true,
        // requireEmailVerification: true,
        // sendResetPasswordEmail: true,
    },
    // emailVerification: {
    //     sendOnSignUp: true,
    //     sendVerificationOnSignUp: true,
    //     disableSignUp: true,
    //     sendVerificationOnSignIn: true,
    //     autoSignInAfterVerification: true,
    //     sendVerificationEmail: async ({user, url}: {user: any, url: string}) => {
    //         const resend = new Resend(process.env.RESEND_API_KEY as string);
    //         const email = await resend.emails.send({
    //             from: 'noreply@databuddy.cc',
    //             to: user.email,
    //             subject: 'Verify your email',
    //             html: `<p>Click <a href="${url}">here</a> to verify your email</p>`
    //         });
    //         console.log(email);
    //     }
    // },
    jwt: {
        enabled: true,
        jwt: {
            issuer: "databuddy.cc",
            audience: "databuddy.cc",
            expirationTime: "30d"
        },
        jwks: {
            disablePrivateKeyEncryption: true
        }
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
                    emailVerified: user.emailVerified || false,
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