'use client';

import { useLogout } from '@/hooks/useLogout';
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

  return null;
};

export default SessionWatcher;
