import type { AuthConfig } from '@auth/core';
import { getRemoteServerClient } from '@package/api/server';
import { CredentialsSignin, type Session, type User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
/* Providers */
import AppleProvider from 'next-auth/providers/apple';
import CredentialsProvider from 'next-auth/providers/credentials';
import FacebookProvider from 'next-auth/providers/facebook';
import GoogleProvider from 'next-auth/providers/google';

async function getClientContext() {
  const { headers, cookies } = await import('next/headers');
  const h = await headers();
  const c = await cookies();
  const clientId = h.get('x-client-id') || c.get('x-client-id')?.value || undefined;

  return {
    ua: h.get('user-agent') || undefined,
    origin: h.get('origin') || undefined,
    host: h.get('host') || undefined,
    clientId,
  };
}

export const authOptions: AuthConfig = {
  debug: true,
  trustHost: true,
  secret: process.env.AUTH_SECRET as string,
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET as string,
      // authorization: {
      //   params: {
      //     prompt: 'select_account',
      //     access_type: 'offline',
      //     response_type: 'code',
      //   },
      // },
      allowDangerousEmailAccountLinking: true,
    }),
    FacebookProvider({
      clientId: process.env.AUTH_FACEBOOK_ID as string,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET as string,
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID as string,
      clientSecret: process.env.APPLE_SECRET as string,
    }),
    CredentialsProvider({
      id: 'login',
      name: 'Login',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<User> {
        const ctx = await getClientContext();

        try {
          const remoteServerClient = getRemoteServerClient(null, {
            'user-agent': ctx.ua,
            origin: ctx.origin,
            host: ctx.host,
            'x-client-id': ctx.clientId,
          });

          const response = await remoteServerClient.auth.login.mutate({
            email: credentials.email as string,
            password: credentials.password as string,
          });

          if (response.status === 'REQUIRES_2FA') {
            return {
              ...response.user,
              requires2FA: true,
              mfaToken: response.mfaToken,
              isTwoFactorEnabled: response.user.isTwoFactorEnabled,
              clientId: ctx.clientId,
              accessToken: '',
              sessionToken: '',
              accessTokenExp: 0,
              refreshTokenExp: 0,
            } as User;
          }

          return {
            ...response.user,
            requires2FA: false,
            accessToken: response.accessToken,
            accessTokenExp: response.accessTokenExp,
            refreshTokenExp: response.refreshTokenExp,
            sessionToken: response.sessionToken,
            isTwoFactorEnabled: response.user.isTwoFactorEnabled as boolean,
            clientId: ctx.clientId!,
          };
        } catch (error: any) {
          console.error('Authorize Error:', error.message);
          class CustomAuthError extends CredentialsSignin {
            override code = error.message;
          }

          throw new CustomAuthError();
        }
      },
    }),
  ],
  useSecureCookies: process.env.NODE_ENV === 'production',
  session: {
    strategy: 'jwt',
    // maxAge: 5 * 60, // for test
    // updateAge: 60, // for test
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: '/auth/sign-in',
    error: '/auth/sign-in',
  },
  cookies: {
    callbackUrl: {
      name:
        process.env.NODE_ENV === 'production'
          ? `__Secure-authjs.callback-url`
          : `authjs.callback-url`,
      options: {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax' as const,
        domain: process.env.APP_HOSTNAME as string,
      },
    },
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? `__Secure-authjs.session-token`
          : `authjs.session-token`,
      options: {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax' as const,
        domain: process.env.APP_HOSTNAME as string,
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === 'production' ? '__Secure-authjs.csrf-token' : 'authjs.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.APP_HOSTNAME as string,
      },
    },
  },
  callbacks: {
    signIn: async ({ user, account, profile }): Promise<boolean> => {
      const ctx = await getClientContext();

      const remoteServerClient = getRemoteServerClient(null, {
        'user-agent': ctx.ua,
        origin: ctx.origin,
        host: ctx.host,
        'x-client-id': ctx.clientId,
      });

      if (account && account?.provider !== 'login') {
        try {
          const response = await remoteServerClient.auth.loginProvider.mutate({
            email: user.email || null,
            nickName: user.name || user.email?.split('@')[0] || 'user',
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            firstName:
              profile?.given_name ||
              (profile as any)?.first_name ||
              user.name?.split(' ')[0] ||
              null,
            lastName:
              profile?.family_name ||
              (profile as any)?.last_name ||
              user.name?.split(' ')[1] ||
              null,
            avatarUrl: user.image as string,
          });

          user.id = response.user.id;
          user.role = response.user.role;
          user.accessToken = response.accessToken;
          user.accessTokenExp = response.accessTokenExp;
          user.refreshTokenExp = response.refreshTokenExp;
          user.nickName = response.user.nickName;
          user.sessionToken = response.sessionToken;
          user.clientId = ctx.clientId!;

          return true;
        } catch (error) {
          console.error('SignIn Provider Error:', error);
          return false;
        }
      }
      return true;
    },

    jwt: async ({
      token,
      user,
      trigger,
      session,
    }: {
      token: JWT;
      user: User;
      trigger?: 'signIn' | 'signUp' | 'update';
      session?: Session;
    }): Promise<JWT> => {
      console.log(`Auth JWT Token = ${JSON.stringify(token)}`);
      console.log(`Auth JWT User = ${JSON.stringify(user)}`);
      const ctx = await getClientContext();

      if (trigger === 'update' && session) {
        if (session.user) {
          return {
            ...token,
            ...session.user,
            forcePasswordChange: session.user.forcePasswordChange ?? token.forcePasswordChange,
          };
        }
        return { ...token, ...session };
      }

      if (user) {
        if (user.requires2FA) {
          return {
            ...token,
            id: user.id,
            email: user.email,
            role: user.role,
            nickName: user.nickName,
            clientId: user.clientId || ctx.clientId || 'unknown',
            requires2FA: true,
            isTwoFactorEnabled: user.isTwoFactorEnabled as boolean,
            mfaToken: user.mfaToken,
            accessToken: '',
            sessionToken: '',
            forcePasswordChange: user.forcePasswordChange || false,
          };
        }

        const accessExp = user.accessTokenExp
          ? Math.floor(new Date(user.accessTokenExp).getTime() / 1000)
          : undefined;
        const refreshExp = user.refreshTokenExp
          ? Math.floor(new Date(user.refreshTokenExp).getTime() / 1000)
          : undefined;

        return {
          ...token,
          id: user.id,
          email: user.email,
          role: user.role,
          nickName: user.nickName,
          accessToken: user.accessToken || '',
          sessionToken: user.sessionToken || '',
          accessTokenExp: accessExp,
          refreshTokenExp: refreshExp,
          clientId: user.clientId || ctx.clientId || 'unknown',
          requires2FA: user.requires2FA || false,
          isTwoFactorEnabled: user.isTwoFactorEnabled as boolean,
          mfaToken: user.mfaToken || undefined,
          forcePasswordChange: user.forcePasswordChange as boolean,
          error: undefined,
        };
      }

      if (token.requires2FA) {
        const currentTime = Math.floor(Date.now() / 1000);
        if (token.iat && currentTime > (token.iat as number) + 600) {
          token.error = 'MfaTokenExpired';
          return token;
        }

        return token;
      }

      const currentTime = Math.floor(Date.now() / 1000);

      if (token.refreshTokenExp && currentTime >= token.refreshTokenExp) {
        console.warn('Refresh token expired, session is dead.');
        token.error = 'RefreshTokenExpired';
        return token;
      }

      if (token.accessTokenExp && currentTime < (token.accessTokenExp as number) - 30) {
        return token;
      }
      try {
        const remoteServerClient = getRemoteServerClient(token.sessionToken, {
          'user-agent': ctx.ua,
          'x-client-id': (token.clientId as string) || ctx.clientId,
          host: ctx.host,
          origin: ctx.origin,
        });

        const updated = await remoteServerClient.auth.refresh.mutate({
          email: token.email as string,
          sub: token.id as string,
        });

        delete token.error;

        return {
          ...token,
          accessToken: updated.accessToken,
          accessTokenExp: Math.floor(new Date(updated.accessTokenExp).getTime() / 1000),
        };
      } catch (error) {
        console.error('RefreshAccessTokenError', error);
        token.error = 'RefreshAccessTokenError';
        return token;
      }
    },

    session: async ({ session, token }: { session: Session; token: JWT }) => {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          email: token.email as string,
          role: token.role as string,
          nickName: token.nickName as string,
          accessToken: token.accessToken as string,
          sessionToken: token.sessionToken as string,
          requires2FA: token.requires2FA as boolean,
          mfaToken: token.mfaToken as string,
          forcePasswordChange: token.forcePasswordChange as boolean,
          isTwoFactorEnabled: token.isTwoFactorEnabled,
        };
        (session as any).error = token.error || null;
      }
      return session;
    },
  },
};

export * from 'next-auth';
export * from 'next-auth/react';
