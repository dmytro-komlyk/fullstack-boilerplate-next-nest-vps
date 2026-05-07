'use client';

import { useThemeCookieStore } from '@package/store/ui';
import React, { useEffect } from 'react';

export function ThemeUIProvider({
  children,
  defaultThemeFromCookie,
}: {
  children: React.ReactNode;
  defaultThemeFromCookie?: string;
}) {
  const { theme: zustandTheme, _hasHydrated } = useThemeCookieStore();

  useEffect(() => {
    const theme = _hasHydrated ? zustandTheme : (defaultThemeFromCookie ?? 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [zustandTheme, _hasHydrated, defaultThemeFromCookie]);

  if (!_hasHydrated) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="size-16 animate-spin rounded-full border-t-4 border-blue-500" />
      </div>
    );
  }

  return children;
}
