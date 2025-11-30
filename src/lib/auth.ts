import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
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

          // Check if user is blocked
          if ((user as any).blocked) {
            throw new Error("Your account has been blocked. Please contact support.");
          }

          // Return user without password
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role, // Include user role
            accountType: user.accountType, // Include account type
            blocked: (user as any).blocked // Include blocked status
          };
        } catch (error) {
          console.error("Authentication error:", error);
          throw error; // Re-throw to be handled by NextAuth
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      console.log('JWT callback - account:', account, 'user:', user);
      // Handle Google OAuth login
      if (account && account.type === "oauth" && user) {
        console.log('Processing OAuth user');
        // Check if user already exists in our database
        await connectDB();
        let existingUser = await User.findOne({ email: user.email });
        
        if (!existingUser) {
          // Create new user if they don't exist
          // Generate a random password for OAuth users
          const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
          
          // For Google OAuth, we need to ensure the user gets a proper MongoDB ObjectId
          // The Google ID is not a valid ObjectId, so we create the user with MongoDB's auto-generated _id
          existingUser = await User.create({
            name: user.name,
            email: user.email,
            emailVerified: true, // Google accounts are considered verified
            password: randomPassword, // Generate a random password for OAuth users
            accountType: "free",
            role: "user",
            blocked: false // Explicitly set blocked status
          });
        }
        
        // Update token with user info
        console.log('Setting token ID to MongoDB ObjectId:', existingUser._id.toString());
        token.id = existingUser._id.toString();
        token.role = existingUser.role || 'user'; // Default to 'user' role if not set
        token.accountType = existingUser.accountType || 'free'; // Default to 'free' account type if not set
        token.blocked = (existingUser as any).blocked || false; // Default to not blocked if not set
      }
      
      console.log('Processing regular credentials login');
      // Handle regular credentials login (exclude OAuth users who were already handled above)
      if (user && (!account || account.type !== "oauth")) {
        token.id = user.id;
        token.role = user.role || 'user'; // Include user role in token, default to 'user'
        token.accountType = user.accountType || 'free'; // Include account type in token, default to 'free'
        token.blocked = user.blocked || false; // Include blocked status in token, default to false
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        console.log('Setting session user ID to:', token.id);
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || 'user'; // Include user role in session, default to 'user'
        session.user.accountType = (token.accountType as string) || 'free'; // Include account type in session, default to 'free'
        session.user.blocked = (token.blocked as boolean) || false; // Include blocked status in session, default to false
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
    async signIn({ user, account, profile, isNewUser }) {
      // This event is triggered after successful sign in
      // We can use it for audit logging or other side effects
      console.log("User signed in:", user);
    }
  }
};

// Extend next-auth types
declare module "next-auth" {
  interface User {
    id: string;
    role?: string; // Add role property
    accountType?: string; // Add account type property
    blocked?: boolean; // Add blocked property
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string; // Add role property
      accountType?: string; // Add account type property
      blocked?: boolean; // Add blocked property
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string; // Add role property
    accountType?: string; // Add account type property
    blocked?: boolean; // Add blocked property
  }
}