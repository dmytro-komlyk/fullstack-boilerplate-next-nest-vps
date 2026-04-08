// next-auth.d.ts
import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string | null;
    role: string;
    nickName: string | null;
    avatarUrl: string | null;
    forcePasswordChange?: boolean;
    isTwoFactorEnabled?: boolean;
    accessToken?: string;
    accessTokenExp?: Date | string | number;
    refreshTokenExp?: Date | string | number;
    sessionToken?: string;
    clientId?: string | undefined;
    requires2FA?: boolean;
    mfaToken?: string | undefined;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      role: string;
      nickName: string;
      accessToken?: string;
      sessionToken?: string;
      requires2FA?: boolean;
      forcePasswordChange?: boolean;
      isTwoFactorEnabled?: boolean;
    } & DefaultSession['user'];
    error?: 'RefreshAccessTokenError' | 'RefreshTokenExpired' | 'MfaTokenExpired';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string | undefined;
    role?: string | undefined;
    email?: string | null | undefined;
    nickName?: string | null | undefined;
    requires2FA?: boolean | undefined;
    mfaToken?: string | undefined;
    accessToken?: string | undefined;
    sessionToken?: string | undefined;
    accessTokenExp?: number | undefined;
    refreshTokenExp?: number | undefined;
    clientId?: string | undefined;
    forcePasswordChange?: boolean;
    isTwoFactorEnabled?: boolean;
    error?:
      | 'RefreshAccessTokenError'
      | 'RefreshTokenExpired'
      | 'MfaTokenExpired'
      | null
      | undefined;
  }
}
