'use client';

import { Button, Input, Link as NextUILink } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthSchema, trpc } from '@package/api';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

import LoadingSpinner from '@/components/loading/LoadingSpinner';
import { getLocalizedError } from 'i18n/error-handler';
import { showToast } from '../Toast';

// interface ForgotPasswordProps {}

const ForgotPassword = () => {
  const t = useTranslations('Auth.ForgotPassword.Form');
  const te = useTranslations('Common.Errors');
  const ts = useTranslations('Common.Success');

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
  } = useForm<AuthSchema.ForgotPasswordFormData>({
    resolver: zodResolver(AuthSchema.forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const forgotPassword = trpc.auth.forgotPassword.useMutation({});

  const onSubmit = async (data: AuthSchema.ForgotPasswordFormData) => {
    try {
      const response = await forgotPassword.mutateAsync({ email: data.email });
      showToast.success(ts(response.message));
    } catch (error: any) {
      showToast.error(getLocalizedError(error.message, te));
    }
  };

  return (
    <div className="w-full max-w-full flex-col items-center gap-6 md:max-w-105 md:pl-4 lg:pl-0">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Email */}
        <Input
          {...register('email')}
          variant="bordered"
          label={t('emailLabel')}
          placeholder={t('emailPlaceholder')}
          id="email"
          type="email"
          isInvalid={(!!errors.email && touchedFields.email) ?? false}
          errorMessage={
            errors.email && touchedFields.email
              ? getLocalizedError(errors.email?.message, te)
              : null
          }
          classNames={{
            base: 'h-[90px] pb-2',
            inputWrapper: [
              'border-1',
              'border-gray-300/30',
              'group-data-[focus=true]:border-brand-500!',
              'group-data-[hover=true]:border-brand-500',
            ],
            input: ['!outline-none'],
          }}
        />

        <Button
          type="submit"
          isLoading={forgotPassword.isPending}
          isDisabled={!isValid || forgotPassword.isPending}
          spinner={<LoadingSpinner />}
          className="bg-brand-500 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 dark:hover:bg-brand-300 dark:active:bg-brand-200 w-full rounded-xl py-3 text-base font-medium text-white transition duration-200 dark:text-white"
        >
          {t('submitButton')}
        </Button>
      </form>
      <div className="mt-4">
        <span className="text-navy-700 text-sm font-medium dark:text-gray-500">
          {t('rememberPassword')}
        </span>
        <NextUILink
          as={Link}
          href="/auth/sign-in"
          className="text-brand-500 hover:text-brand-600 ml-1 text-sm font-medium dark:text-white"
        >
          {t('backToLogin')}
        </NextUILink>
      </div>
    </div>
  );
};

export default ForgotPassword;
