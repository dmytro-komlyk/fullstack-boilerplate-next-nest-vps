import ForgotPassword from '@/components/auth/ForgotPassword';
import Default from '@/components/auth/variants/DefaultAuthLayout';
import { getTranslations } from 'next-intl/server';

async function ForgotPasswordDefault() {
  const t = await getTranslations('Auth.ForgotPassword.Public');

  return (
    <Default
      maincard={
        <div className="mb-16 mt-16 flex h-full w-full items-center justify-center px-2 md:mx-0 md:px-0 lg:mb-10 lg:items-center lg:justify-start">
          {/* Forgot password section */}
          <div className="w-full max-w-full flex-col items-center md:pl-4 lg:pl-0 xl:max-w-105">
            <h3 className="mb-2.5 text-4xl font-bold text-navy-700 dark:text-white">
              {t('title')}
            </h3>
            <p className="mb-9 ml-1 text-base text-gray-600 dark:text-gray-400">
              {t('description')}
            </p>
            <ForgotPassword />
          </div>
        </div>
      }
    />
  );
}

export default ForgotPasswordDefault;
