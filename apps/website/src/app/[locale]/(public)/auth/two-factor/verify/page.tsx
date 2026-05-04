import TwoFactor from '@/components/auth/TwoFactor';
import Default from '@/components/auth/variants/DefaultAuthLayout';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

async function TwoFactorVerifyPage() {
  const t = await getTranslations('Auth.TwoFactor.Verify');

  return (
    <Default
      maincard={
        <div className="mb-16 mt-16 flex h-full w-full items-center justify-center px-2 md:mx-0 md:px-0 lg:mb-10 lg:items-center lg:justify-start">
          <div className="w-full max-w-full flex-col items-center md:pl-4 lg:pl-0 xl:max-w-105">
            <h3 className="mb-2.5 text-4xl font-bold text-navy-700 dark:text-white">
              {t('title')}
            </h3>
            <p className="mb-7 ml-1 text-base text-gray-600 dark:text-gray-400">
              {t('description')}
            </p>

            <TwoFactor mode="verify" />

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                {t('havingTrouble')}{' '}
                <Link href="/support" className="font-medium text-brand-500 hover:text-brand-600">
                  {t('contactSupport')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      }
    />
  );
}

export default TwoFactorVerifyPage;
