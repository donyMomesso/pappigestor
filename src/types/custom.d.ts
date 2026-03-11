// src/types/custom.d.ts
declare module 'next-auth/react' {
  import type { Session, User } from 'next-auth';

  export type UseSessionResult = {
    data: Session | null;
    status: 'loading' | 'authenticated' | 'unauthenticated';
  };

  export function useSession(): UseSessionResult;
  export function getSession(): Promise<Session | null>;
  export function signIn(provider?: string | null, options?: any, authorizationParams?: any): Promise<any>;
  export function signOut(options?: any): Promise<any>;
  export function getCsrfToken(): Promise<string | null>;
  export const SessionProvider: any;

  export default {
    useSession,
    getSession,
    signIn,
    signOut,
    getCsrfToken,
    SessionProvider
  } as any;
}

declare module 'next-auth/providers/google' {
  const GoogleProvider: any;
  export default GoogleProvider;
}

declare module 'next-auth/providers/*' {
  const provider: any;
  export default provider;
}

declare module 'hono/cors' {
  const cors: (...args: any[]) => any;
  export default cors;
}

declare module 'hono/*' {
  const anyModule: any;
  export default anyModule;
}