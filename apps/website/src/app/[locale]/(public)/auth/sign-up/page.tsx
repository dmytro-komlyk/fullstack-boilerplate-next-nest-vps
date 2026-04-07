import SignUp from '@/components/auth/SignUp';
import Default from '@/components/auth/variants/DefaultAuthLayout';
import { baseUrl } from '@/utils/constants';
import { getTranslations } from 'next-intl/server';

async function SignUpPage({ searchParams }: { searchParams: Promise<{ callbackUrl: string }> }) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || `${baseUrl}/auth/sign-in`;
  const t = await getTranslations('Auth.SignUp.Public');

  return (
    <Default
      maincard={
        <div className="mb-16 mt-16 flex h-full w-full items-center justify-center px-2 md:mx-0 md:px-0 lg:mb-10 lg:items-center lg:justify-start">
          {/* Sign up section */}
          <div className="w-full max-w-full flex-col items-center md:pl-4 lg:pl-0 xl:max-w-105">
            <h3 className="mb-2.5 text-4xl font-bold text-navy-700 dark:text-white">
              {t('title')}
            </h3>
            <p className="mb-7 ml-1 text-base text-gray-600">{t('description')}</p>
            <SignUp callbackUrl={callbackUrl} />
          </div>
        </div>
      }
    />
  );
}

export default SignUpPage;
