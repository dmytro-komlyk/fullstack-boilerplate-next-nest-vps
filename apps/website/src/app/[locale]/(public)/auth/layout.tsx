'use client';

import SettingsWidgetPlugin from '@/components/plugins/SettingsWidgetPlugin';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { PropsWithChildren } from 'react';

interface AuthProps extends PropsWithChildren {}

export default function AuthLayout({ children }: AuthProps) {
  const { data: session } = useSession();

  if (session?.user) {
    redirect('/');
  }

  return (
    <div className="relative float-right h-full min-h-screen w-full ">
      <SettingsWidgetPlugin />
      <main className={`mx-auto min-h-screen`}>{children}</main>
    </div>
  );
}
