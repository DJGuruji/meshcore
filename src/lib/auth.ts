import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "./db";
import { User } from "./models";
import { validateTurnstileToken } from "./turnstile";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        turnstileToken: { label: "Turnstile Token", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.turnstileToken) {
          return null;
        }

        // Validate Turnstile token
        const isTurnstileValid = await validateTurnstileToken(credentials.turnstileToken);
        if (!isTurnstileValid) {
          console.error("Turnstile validation failed");
          return null;
        }

        try {
          await connectDB();
          
          // Find user by email and include password for comparison
          const user = await User.findOne({ email: credentials.email }).select("+password");
          
          if (!user) {
            return null;
          }

          // Check if password matches
          const isMatch = await user.matchPassword(credentials.password);
          
          if (!isMatch) {
            return null;
          }

          // Check if email is verified
          if (!user.emailVerified) {
            throw new Error("Please verify your email address before signing in");
          }

          // Return user without password
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role // Include user role
          };
        } catch (error) {
          console.error("Authentication error:", error);
          throw error; // Re-throw to be handled by NextAuth
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role; // Include user role in token
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string; // Include user role in session
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET || "your-default-secret-do-not-use-in-production",
  // Handle sign in errors
  events: {
    async signIn({ user, account, profile, isNewUser, error }) {
      if (error) {
        console.error("Sign in error:", error);
      }
    }
  }
};

// Extend next-auth types
declare module "next-auth" {
  interface User {
    id: string;
    role?: string; // Add role property
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string; // Add role property
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string; // Add role property
  }
}