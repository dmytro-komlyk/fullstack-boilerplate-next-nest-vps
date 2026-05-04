'use client';

import SettingsWidgetPlugin from '@/components/plugins/SettingsWidgetPlugin';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PropsWithChildren, useEffect } from 'react';

interface AuthProps extends PropsWithChildren {}

export default function AuthLayout({ children }: AuthProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const requiresTwoFactorSetup = Boolean(
    session?.user?.twoFactorSetupPending && !session?.user?.isTwoFactorEnabled
  );
  const shouldRedirect = Boolean(
    session?.user && !session.user.requires2FA && !requiresTwoFactorSetup
  );

  useEffect(() => {
    if (shouldRedirect) {
      router.replace('/');
    }
  }, [router, shouldRedirect]);

  if (shouldRedirect) {
    return null;
  }

  return (
    <div className="relative float-right h-full min-h-screen w-full ">
      <SettingsWidgetPlugin />
      <main className={`mx-auto min-h-screen`}>{children}</main>
    </div>
  );
}
