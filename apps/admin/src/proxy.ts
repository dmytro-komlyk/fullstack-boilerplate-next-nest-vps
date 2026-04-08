import { defaultLanguage, supportedLanguages } from '@package/i18n';
import jwt from 'jsonwebtoken';
import createIntlMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from './utils/next-auth';

const COOKIE_DOMAIN = process.env.APP_HOSTNAME;

const intlMiddleware = createIntlMiddleware({
  locales: supportedLanguages,
  defaultLocale: defaultLanguage,
  localePrefix: 'always',
});

export async function proxy(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production';
  const { pathname, search, origin } = request.nextUrl;

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') || // (png, ico, json, .well-known)
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const response = intlMiddleware(request);
  const segments = pathname.split('/');
  const isLocalePresent = supportedLanguages.includes(segments[1] as any);
  const purePathname = isLocalePresent ? '/' + segments.slice(2).join('/') : pathname;
  const currentLocale = isLocalePresent ? segments[1] : defaultLanguage;

  const getLocalePath = (path: string) =>
    `/${currentLocale}${path.startsWith('/') ? path : `/${path}`}`;

  const isAuthRoute = purePathname.startsWith('/auth');
  const session = await auth();

  if (!session?.user) {
    if (isAuthRoute) {
      return response;
    }

    const signInUrl = new URL(getLocalePath('/auth/sign-in'), origin);

    if (purePathname !== '/' && purePathname !== '') {
      signInUrl.searchParams.set('callbackUrl', `${pathname}${search}`);
    }

    const redirectResponse = NextResponse.redirect(signInUrl);
    response.headers.forEach((v, k) => redirectResponse.headers.set(k, v));
    return redirectResponse;
  }

  if (session?.user) {
    const { forcePasswordChange, isTwoFactorEnabled, requires2FA } = session.user;

    if (isAuthRoute && !requires2FA && isTwoFactorEnabled && !forcePasswordChange) {
      const dashboardUrl = new URL(getLocalePath('/dashboard'), request.url);
      const redirectResponse = NextResponse.redirect(dashboardUrl);
      response.headers.forEach((v, k) => redirectResponse.headers.set(k, v));
      return redirectResponse;
    }

    if (requires2FA) {
      if (!purePathname.startsWith('/auth/two-factor/verify')) {
        const verifyUrl = new URL(getLocalePath('/auth/two-factor/verify'), request.url);
        const redirectResponse = NextResponse.redirect(verifyUrl);
        response.headers.forEach((v, k) => redirectResponse.headers.set(k, v));
        return redirectResponse;
      }

      return response;
    }

    if (forcePasswordChange || !isTwoFactorEnabled) {
      if (!purePathname.startsWith('/profile/onboarding')) {
        const onboardUrl = new URL(getLocalePath('/profile/onboarding'), request.url);
        const redirectResponse = NextResponse.redirect(onboardUrl);
        response.headers.forEach((v, k) => redirectResponse.headers.set(k, v));
        return redirectResponse;
      }

      return response;
    }
  }

  if (!session?.user?.accessToken) {
    const token = jwt.decode(session.user.accessToken) as { exp?: number } | null;
    const now = Math.floor(Date.now() / 1000);

    if (token?.exp && token.exp < now) {
      const signInUrl = new URL(getLocalePath('/auth/sign-in'), origin);
      const deleteCookie = (name: string) =>
        `${
          isProduction ? '__Secure-' : ''
        }${name}=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${COOKIE_DOMAIN}`;
      const redirectResponse = NextResponse.redirect(signInUrl);
      redirectResponse.headers.append('Set-Cookie', deleteCookie('authjs.session-token'));
      redirectResponse.headers.append('Set-Cookie', deleteCookie('authjs.csrf-token'));
      redirectResponse.headers.append('Set-Cookie', deleteCookie('authjs.callback-url'));

      response.headers.forEach((v, k) => redirectResponse.headers.set(k, v));
      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|static|api).*)'],
};
