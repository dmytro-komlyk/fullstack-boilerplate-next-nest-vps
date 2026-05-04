'use client';

import Footer from '@/components/footer/FooterAuthDefault';
import NavLink from '@/components/link/NavLink';
import authImg from '@/public/img/auth.png';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { JSX } from 'react';
import { IoChevronBack } from 'react-icons/io5';

function Default(props: { maincard: JSX.Element }) {
  const { maincard } = props;
  const searchParams = useSearchParams();
  const t = useTranslations('Auth.SignIn');

  const isFromMobile = searchParams.get('from') === 'mobile';

  const handleBackToApp = () => {
    window.location.href = 'omni://login';

    setTimeout(() => {
      window.close();
    }, 500);
  };

  return (
    <div className="relative flex">
      <div className="mx-auto flex min-h-full w-full flex-col justify-start pt-12 md:max-w-[75%] lg:max-w-253.25 lg:px-8 lg:pt-0 xl:min-h-screen xl:max-w-345.75 xl:px-0 xl:pl-17.5">
        <div className="mb-auto flex flex-col pl-5 pr-5 md:pl-12 md:pr-0 lg:max-w-[48%] lg:pl-0 xl:max-w-full">
          <div className="mt-0 w-max lg:pt-10">
            {isFromMobile ? (
              <button
                onClick={handleBackToApp}
                className="mx-auto flex h-fit w-fit items-center hover:cursor-pointer"
              >
                <IoChevronBack />
                <p className="ml-3 text-sm text-gray-600">{t('backToMobileApp')}</p>
              </button>
            ) : (
              <NavLink href="/">
                <div className="mx-auto flex h-fit w-fit items-center hover:cursor-pointer">
                  <IoChevronBack />
                  <p className="ml-3 text-sm text-gray-600">{t('backToWebsite')}</p>
                </div>
              </NavLink>
            )}
          </div>
          {maincard}
          <div className="absolute right-0 hidden h-full min-h-screen md:block lg:w-[49vw] 2xl:w-[44vw]">
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-linear-to-br from-brand-400 to-brand-600 bg-cover bg-center lg:rounded-bl-[120px] xl:rounded-bl-[200px] shadow-2xl">
              <div
                style={{
                  backgroundImage: `url(${authImg.src})`,
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default Default;
