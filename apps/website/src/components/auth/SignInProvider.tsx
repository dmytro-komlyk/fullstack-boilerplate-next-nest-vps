'use client';

import LoadingSpinner from '@/components/loading/LoadingSpinner';
import { Button, Image as NextUIImage } from '@heroui/react';
import { signIn } from 'next-auth/react';
import NextImage from 'next/image';
import { useState } from 'react';

import { baseUrl } from '@/utils/constants';
import { getLocalizedError } from 'i18n/error-handler';
import { useTranslations } from 'next-intl';
import FacebookLogo from 'public/icons/facebook-logo.svg';
import GoogleLogo from 'public/icons/google-logo.svg';
import { showToast } from '../Toast';

const providers = {
  google: {
    name: 'Google',
    icon: GoogleLogo,
  },
  facebook: {
    name: 'Facebook',
    icon: FacebookLogo,
  },
};

interface SignInProviderProps {
  provider: keyof typeof providers;
}

const SignInProvider = ({ provider }: SignInProviderProps) => {
  const t = useTranslations('Auth.SignIn.Public');
  const te = useTranslations('Common.Errors');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    setIsSubmitting(true);
    try {
      await signIn(provider, {
        callbackUrl: `${baseUrl}/?toast=welcome`,
      });
    } catch {
      showToast.error(getLocalizedError(`providerLoginError|${providers[provider].name}`, te));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button
      onPress={handleLogin}
      disabled={isSubmitting}
      isLoading={isSubmitting}
      spinner={<LoadingSpinner />}
      spinnerPlacement="end"
      variant="flat"
      className="w-full justify-center bg-gray-300/30 text-sm hover:bg-gray-300/50 dark:bg-gray-800 dark:text-white"
      startContent={
        <NextUIImage
          as={NextImage}
          src={providers[provider].icon}
          width={20}
          height={20}
          className="object-contain"
          alt={`${providers[provider].name} button login`}
        />
      }
    >
      {t('providerBtn', { provider: providers[provider].name })}
    </Button>
  );
};

export default SignInProvider;
