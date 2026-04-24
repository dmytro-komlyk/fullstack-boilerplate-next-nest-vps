'use client';

import { useLogout } from '@/hooks/useLogout';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';

const SessionWatcher = () => {
  const { data: session } = useSession();
  const { handleLogout } = useLogout();
  const hasLoggedOut = useRef(false);

  useEffect(() => {
    const isSessionExpired =
      session?.error === 'RefreshTokenExpired' ||
      session?.error === 'RefreshAccessTokenError' ||
      session?.error === 'MfaTokenExpired';

    if (isSessionExpired && !hasLoggedOut.current) {
      hasLoggedOut.current = true;

      handleLogout('expired').catch(() => {
        window.location.href = '/auth/sign-in?toast=session_expired';
      });
    }
  }, [session, handleLogout]);

  useEffect(() => {
    const accessToken = session?.user?.accessToken;
    if (!accessToken) return;

    try {
      const token = jwtDecode<JwtPayload>(accessToken);
      if (!token.exp) return;

      const timeLeft = token.exp * 1000 - Date.now();

      if (timeLeft > 0) {
        const timer = setTimeout(() => {
          window.dispatchEvent(new Event('focus'));
          setTimeout(() => {
            if (!hasLoggedOut.current) {
              handleLogout('expired');
            }
          }, 2000);
        }, timeLeft);

        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }, [session, handleLogout]);

  return null;
};

export default SessionWatcher;
