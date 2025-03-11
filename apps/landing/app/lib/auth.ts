// import NextAuth from "next-auth";
// import { PrismaAdapter } from "@auth/prisma-adapter";
// import CredentialsProvider from "next-auth/providers/credentials";
// import GoogleProvider from "next-auth/providers/google";
// import GithubProvider from "next-auth/providers/github";
// import bcrypt from "bcrypt";
// import prisma from "@/lib/db";
// import { Role } from "@prisma/client";

// // Use environment variable for the secret or provide a default for development
// const authSecret = process.env.NEXTAUTH_SECRET || "your-development-secret-at-least-32-chars";

// export const {
//   handlers: { GET, POST },
//   auth,
//   signIn,
//   signOut,
// } = NextAuth({
//   adapter: PrismaAdapter(prisma),
//   session: { strategy: "jwt" },
//   pages: {
//     signIn: "/login",
//     error: "/login",
//   },
//   secret: authSecret,
//   callbacks: {
//     async session({ session, token }) {
//       if (token.sub && session.user) {
//         session.user.id = token.sub;
//         session.user.role = token.role as Role;
//       }
//       return session;
//     },
//     async jwt({ token }) {
//       if (!token.sub) return token;

//       const user = await prisma.user.findUnique({
//         where: { id: token.sub },
//       });

//       if (user) {
//         token.role = user.role;
//       }

//       return token;
//     },
//   },
//   providers: [
//     CredentialsProvider({
//       name: "Credentials",
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Password", type: "password" },
//       },
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials?.password) {
//           return null;
//         }

//         const user = await prisma.user.findUnique({
//           where: { email: credentials.email as string },
//         });

//         if (!user || !user.password) {
//           return null;
//         }

//         const passwordMatch = await bcrypt.compare(
//           credentials.password as string,
//           user.password
//         );

//         if (!passwordMatch) {
//           return null;
//         }

//         return {
//           id: user.id,
//           name: user.name,
//           email: user.email,
//           image: user.image,
//           role: user.role,
//         };
//       },
//     }),
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID || "",
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
//     }),
//     GithubProvider({
//       clientId: process.env.GITHUB_CLIENT_ID || "",
//       clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
//     }),
//   ],
// });

// // Helper functions for authentication
// export async function getUserById(id: string) {
//   try {
//     const user = await prisma.user.findUnique({
//       where: { id },
//     });
//     return user;
//   } catch {
//     return null;
//   }
// }

// export async function getUserByEmail(email: string) {
//   try {
//     const user = await prisma.user.findUnique({
//       where: { email },
//     });
//     return user;
//   } catch {
//     return null;
//   }
// }

// export async function createUser(data: {
//   name: string;
//   email: string;
//   password: string;
//   role?: Role;
//   imageUrl?: string;
// }) {
//   try {
//     const hashedPassword = await bcrypt.hash(data.password, 10);
//     const user = await prisma.user.create({
//       data: {
//         name: data.name,
//         email: data.email,
//         password: hashedPassword,
//         role: data.role || "USER",
//         image: data.imageUrl || null,
//       },
//     });
//     return user;
//   } catch {
//     return null;
//   }
// }

// // Authorization helpers
// export function canCreatePost(userRole: Role) {
//   return ["AUTHOR", "EDITOR", "ADMIN"].includes(userRole);
// }

// export function canEditPost(userRole: Role, authorId: string, userId: string) {
//   if (userRole === "ADMIN" || userRole === "EDITOR") return true;
//   if (userRole === "AUTHOR" && authorId === userId) return true;
//   return false;
// }

// export function canDeletePost(userRole: Role, authorId: string, userId: string) {
//   if (userRole === "ADMIN") return true;
//   if (userRole === "EDITOR" && authorId === userId) return true;
//   return false;
// }

// export function canManageUsers(userRole: Role) {
//   return userRole === "ADMIN";
// }

// export function canManageJobs(userRole: Role) {
//   return ["ADMIN", "EDITOR"].includes(userRole);
// }

// // Type definitions
// declare module "next-auth" {
//   interface Session {
//     user: {
//       id: string;
//       name?: string | null;
//       email?: string | null;
//       image?: string | null;
//       role: Role;
//     };
//   }
// }
