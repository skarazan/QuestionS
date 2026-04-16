import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    CredentialsProvider({
      id: "user-credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }, // "user" or "admin"
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const role = credentials.role || "user";

        if (role === "admin") {
          // Admin login
          const admin = await prisma.admin.findUnique({
            where: { email: credentials.email },
          });
          if (!admin) return null;
          const valid = await bcrypt.compare(credentials.password, admin.password);
          if (!valid) return null;
          return {
            id: admin.id,
            email: admin.email,
            name: admin.name ?? "Admin",
            role: "admin",
          };
        } else {
          // User login
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });
          if (!user || !user.password) return null;
          const valid = await bcrypt.compare(credentials.password, user.password);
          if (!valid) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: "user",
          };
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "user";
      }
      // Google OAuth users are always "user" role
      if (account?.provider === "google") {
        token.role = "user";
        // Fetch actual DB user id
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });
        if (dbUser) token.id = dbUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
