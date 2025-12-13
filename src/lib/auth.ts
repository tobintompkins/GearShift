import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from './db';
import bcrypt from 'bcryptjs';

// Ensure we have a secret
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

if (!authSecret) {
  console.error('CRITICAL ERROR: NEXTAUTH_SECRET or AUTH_SECRET is not set!');
  console.error('Please add NEXTAUTH_SECRET to your .env.local file');
}

// NextAuth configuration
const authOptions = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.password) {
            return null;
          }

          // Check if prisma is available
          if (!prisma || !prisma.user) {
            console.error('Prisma client not initialized');
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { username: credentials.username as string },
          });

          if (!user) {
            return null;
          }

          if (!user.isActive) {
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password as string, user.password);

          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            name: user.name || user.username,
            email: user.email || undefined,
            username: user.username,
          };
        } catch (error: any) {
          console.error('Authorization error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt' as const,
  },
  secret: authSecret || 'fallback-secret-change-in-production',
};

// Initialize NextAuth
export const { auth, handlers, signIn, signOut } = NextAuth(authOptions);


