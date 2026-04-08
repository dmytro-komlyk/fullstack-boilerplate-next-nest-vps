import TwoFactor from '@/components/auth/TwoFactor';
import Default from '@/components/auth/variants/DefaultAuthLayout';
import { getTranslations } from 'next-intl/server';
import { TbAuth2Fa } from 'react-icons/tb';

async function TwoFactorSetupDefault() {
  const t = await getTranslations('Auth.TwoFactor.Setup');
  return (
    <Default
      maincard={
        <div className="relative flex h-full w-full items-center justify-center px-4">
          <div className="z-10 w-full max-w-112.5 overflow-hidden rounded-3xl border-1 border-navy-700/10 bg-white/80 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-navy-900/90">
            <div className="flex items-center justify-between rounded-t-3xl bg-orange-600 px-8 py-3 dark:bg-orange-500">
              <TbAuth2Fa className="size-4 text-white" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
                {t('header')}
              </span>
              <div className="flex gap-1.5">
                <div className="size-2 animate-pulse rounded-full bg-white/40" />
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

              <TwoFactor mode="setup" />

              <div className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-gray-50 py-3 dark:bg-white/5">
                <div className="size-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  {t('secureStatus')}
                </span>
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}

export default TwoFactorSetupDefault;
