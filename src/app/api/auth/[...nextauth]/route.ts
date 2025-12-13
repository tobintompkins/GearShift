import { handlers } from '@/lib/auth';

// Export GET and POST handlers for NextAuth
export const { GET, POST } = handlers;

// Add error handling
export const runtime = 'nodejs';


