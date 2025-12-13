'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

export default function SessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  // Always render - don't let SessionProvider errors crash the app
  return (
    <NextAuthSessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      {children}
    </NextAuthSessionProvider>
  );
}


