import Default from '@/components/auth/variants/DefaultAuthLayout';
import VerifyEmail from '@/components/auth/VerifyEmail';
import { IoShieldCheckmark } from 'react-icons/io5';
import { RiLoader2Fill } from 'react-icons/ri';

async function VerifyEmailDefault({
  searchParams,
}: {
  searchParams: Promise<{ token: string; email: string }>;
}) {
  const { token, email } = await searchParams;

  return (
    <Default
      maincard={
        <div className="relative flex h-full w-full items-center justify-center px-4">
          <div className="z-10 w-full max-w-112.5 overflow-hidden rounded-3xl border-1 border-navy-700/10 bg-white/80 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-navy-900/90">
            <div className="flex items-center justify-between bg-green-500 px-8 py-3 dark:bg-green-600">
              <div className="flex items-center gap-2">
                {token ? (
                  <RiLoader2Fill className="size-4 animate-spin text-white" />
                ) : (
                  <IoShieldCheckmark className="size-4 text-white" />
                )}
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
                  {token ? 'Validating Credentials...' : 'Authentication Pending'}
                </span>
              </div>
              <div className="flex gap-1.5">
                <div className="size-2 rounded-full bg-white/20" />
                <div className="size-2 rounded-full bg-white/20" />
              </div>
            </div>

            <div className="p-8 md:p-10">
              <h3 className="mb-2 text-3xl font-black tracking-tight text-navy-800 dark:text-white">
                Verify Email
              </h3>

              <div className="mb-8">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {token
                    ? 'Security protocol in progress. We are verifying your administrative access for '
                    : 'A verification link has been dispatched to '}
                  <span className="font-bold text-navy-700 dark:text-brand-400">{email}</span>.
                </p>
              </div>

              <VerifyEmail token={token} email={email} />

              <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl bg-green-50 py-3 dark:bg-green-500/10 border-1 border-green-100 dark:border-green-500/20">
                <div
                  className={`size-2 rounded-full ${token ? 'bg-green-500 animate-ping' : 'bg-amber-400'}`}
                />
                <span className="text-[11px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">
                  {token ? 'System Check: Active' : 'Waiting for User Action'}
                </span>
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}

export default VerifyEmailDefault;
