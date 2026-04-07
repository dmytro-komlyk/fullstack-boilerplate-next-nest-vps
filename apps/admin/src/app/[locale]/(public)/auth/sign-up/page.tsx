import SignUp from '@/components/auth/SignUp';
import Default from '@/components/auth/variants/DefaultAuthLayout';
import { baseUrl } from '@/utils/constants';
import { getTranslations } from 'next-intl/server';
import { FaUserPlus } from 'react-icons/fa6';

async function SignUpPage({ searchParams }: { searchParams: Promise<{ callbackUrl: string }> }) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || `${baseUrl}/auth/sign-in`;
  const t = await getTranslations('Auth.SignUp.Admin');

  return (
    <Default
      maincard={
        <div className="relative flex h-full w-full items-center justify-center px-4">
          <div className="z-10 w-full max-w-125 overflow-hidden rounded-3xl border-1 border-navy-700/10 bg-white/80 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-navy-900/90">
            <div className="flex items-center justify-between rounded-t-3xl bg-navy-700 px-8 py-3 dark:bg-brand-600">
              <div className="flex items-center gap-2">
                <FaUserPlus className="size-4 text-white" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
                  {t('badge')}
                </span>
              </div>
              <div className="flex gap-1.5">
                <div className="size-2 rounded-full bg-white/20" />
                <div className="size-2 rounded-full bg-white/20" />
              </div>
            </div>

            <div className="p-8 md:p-10">
              <h3 className="mb-2 text-3xl font-black tracking-tight text-navy-800 dark:text-white">
                {t('title')}
              </h3>
              <p className="mb-8 text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('description')}
              </p>
              <SignUp callbackUrl={callbackUrl} />
            </div>
          </div>
        </div>
      }
    />
  );
}

export default SignUpPage;
