import { redirect } from 'next/navigation';

import { auth } from '@/utils/next-auth';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const session = await auth();

  if (!session) {
    redirect('/auth/sign-in');
  }

  return (
    <div className="size-full">
      <p className="px-2">Dashboard Page</p>
    </div>
  );
}
