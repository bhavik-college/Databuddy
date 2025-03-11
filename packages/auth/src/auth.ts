import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { customSession } from "better-auth/plugins";
import { db } from "@databuddy/db";

export const canManageUsers = (role: string) => {
  return role === 'ADMIN'
}


export const auth = betterAuth({
    database: prismaAdapter(db, {
        provider: "postgresql",
    }),
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
                select: { role: true }
            });
            
            return {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
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
    ]
})