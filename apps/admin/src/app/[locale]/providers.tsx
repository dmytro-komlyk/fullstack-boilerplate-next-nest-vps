'use client';

import { HeroUIProvider } from '@heroui/react';
import { TrpcProvider } from '@package/api/provider';
import { ThemeUIProvider } from '@package/ui/ThemeProvider';
import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { AbstractIntlMessages, NextIntlClientProvider } from 'next-intl';
import { useRouter } from 'next/navigation';
import React from 'react';

interface IProviderProps {
  children: React.ReactNode;
  session: Session | null;
  defaultThemeFromCookie: string;
  locale: string;
  messages: AbstractIntlMessages;
}

export function Providers({
  children,
  session,
  defaultThemeFromCookie,
  locale,
  messages,
}: IProviderProps) {
  const router = useRouter();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SessionProvider session={session}>
        <TrpcProvider>
          <ThemeUIProvider defaultThemeFromCookie={defaultThemeFromCookie}>
            <HeroUIProvider navigate={router.push}>{children}</HeroUIProvider>
          </ThemeUIProvider>
        </TrpcProvider>
      </SessionProvider>
    </NextIntlClientProvider>
  );
}
