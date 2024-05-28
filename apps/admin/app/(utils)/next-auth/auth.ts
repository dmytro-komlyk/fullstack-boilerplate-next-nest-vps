import { DOCKER_SERVICE_URL, SERVER_URL } from '@admin/app/(lib)/constants';
import { expiresInToMilliseconds } from '@server/helpers/time-converted.helper';
import type { Session, User } from 'next-auth';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: any = {
  debug: true,
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    error: '/authentication/signin',
    signIn: '/authentication/signin',
    newUser: '/authentication/signup',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        login: {
          label: 'Email',
          type: 'email',
          placeholder: 'email@example.com',
        },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<any> {
        const response = await fetch(
          `${
            process.env.NODE_ENV === 'production'
              ? DOCKER_SERVICE_URL
              : SERVER_URL
          }/api/trpc/auth.login`,
          {
            method: 'POST',
            body: JSON.stringify({
              email: credentials.login,
              password: credentials.password,
            }),
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );
        const parsedResponse = await response.json();
        if (response.status === 200) {
          return parsedResponse.result.data;
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: expiresInToMilliseconds(
      process.env.NEXTAUTH_JWT_ACCESS_TOKEN_EXPIRATION as string,
    ),
  },
  callbacks: {
    jwt: async ({ token, user }: { token: any; user: User }): Promise<any> => {
      if (user) {
        token.accessToken = user.accessToken;
        token.accessTokenExpires = user.accessTokenExpires;
        token.id = user.id;
      }

      return token;
    },
    session: async ({
      session,
      token,
    }: {
      session: Session;
      token: any;
    }): Promise<any> => {
      return {
        ...session,
        user: {
          ...session.user,
          accessToken: token.accessToken as string,
          id: token.id,
        },
        error: token.error,
      };
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
