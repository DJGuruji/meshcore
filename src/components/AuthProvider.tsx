'use client';

import { SessionProvider } from 'next-auth/react';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true} // Refetch session when window gains focus
      basePath="/api/auth" // Set the base path for authentication API routes
    >
      {children}
    </SessionProvider>
  );
} 