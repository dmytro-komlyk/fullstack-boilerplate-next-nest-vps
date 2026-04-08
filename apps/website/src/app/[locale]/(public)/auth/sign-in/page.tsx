import SignIn from '@/components/auth/SignIn';
import SignInProvider from '@/components/auth/SignInProvider';
import Default from '@/components/auth/variants/DefaultAuthLayout';
import { baseUrl } from '@/utils/constants';
import { getTranslations } from 'next-intl/server';

async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; email?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || `${baseUrl}/dashboard?toast=welcome`;
  const defaultEmail = params.email || '';
  const t = await getTranslations('Auth.SignIn.Public');

  return (
    <Default
      maincard={
        <div className="mb-16 mt-16 flex h-full w-full items-center justify-center px-2 md:mx-0 md:px-0 lg:mb-10 lg:items-center lg:justify-start">
          {/* Sign in section */}
          <div className="w-full max-w-full flex-col items-center md:pl-4 lg:pl-0 xl:max-w-105">
            <h3 className="mb-2.5 text-4xl font-bold text-navy-700 dark:text-white">
              {t('title')}
            </h3>
            <p className="mb-7 ml-1 text-base text-gray-600">{t('description')}</p>
            <SignIn callbackUrl={callbackUrl} defaultEmail={defaultEmail} />
            <div className="my-6 flex items-center gap-3">
              <div className="h-px w-full bg-gray-200 dark:bg-navy-700!" />
              <p className="text-base text-gray-600">{t('or')}</p>
              <div className="h-px w-full bg-gray-200 dark:bg-navy-700!" />
            </div>
            <div className="mb-6 flex flex-col gap-4">
              <SignInProvider provider="google" />
              <SignInProvider provider="facebook" />
            </div>
          </div>
        </div>
      }
    />
  );
}

export default SignInPage;
