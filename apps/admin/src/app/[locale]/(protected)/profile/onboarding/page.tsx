import OnboardingClient from '@/components/auth/OnboardingClient';
import { auth } from '@/utils/next-auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function OnBoarding() {
  const session = await auth();

  const user = session?.user;

  if (user?.forcePasswordChange) {
    return <OnboardingClient initialStep="PASSWORD" user={user} />;
  }

  if (!user?.isTwoFactorEnabled) {
    return <OnboardingClient initialStep="2FA" user={user} />;
  }

  redirect('/dashboard');
}
