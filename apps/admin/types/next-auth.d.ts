import 'next-auth';

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as
   * a prop on the `SessionProvider` React Context
   */
  interface User {
    id: string;
    email: string;
    name: string;
    accessToken: string;
    accessTokenExpires: number;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      accessToken: string;
      accessTokenExpires: number;
    } | null;
    expires: string;
    error: string;
  }
}
