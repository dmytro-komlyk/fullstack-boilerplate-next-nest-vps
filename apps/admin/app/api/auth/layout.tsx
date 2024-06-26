import Image from 'next/image';

import BackHomeButton from '../../(components)/BackHomeButton';

export default function AuthLayout({
  children, // will be a page or nested layout
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="h-screen w-screen bg-slate-200 py-10 text-sm font-medium dark:bg-slate-700">
      <div className="container mx-auto my-0 flex flex-col items-center gap-14">
        <div className="w-full">
          <BackHomeButton />
        </div>
        <div className="flex items-center gap-6">
          <Image
            className="relative drop-shadow-[0_0_0.3rem_#ffffff70]"
            src="/next_auth.png"
            alt="NextAuth.js Logo"
            width={75}
            height={75}
            priority
          />
          <h1 className="text-5xl text-slate-700 dark:text-slate-200">
            NextAuth.js
          </h1>
        </div>
        <div className="w-full max-w-sm rounded-lg bg-slate-700/30 shadow dark:bg-slate-200">
          {children}
        </div>
      </div>
    </main>
  );
}
