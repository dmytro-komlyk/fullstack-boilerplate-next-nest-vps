'use client';

import { Button, Input } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthSchema, trpc } from '@package/api';
import { getLocalizedError } from 'i18n/error-handler';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5';
import LoadingSpinner from '../loading/LoadingSpinner';
import { showToast } from '../Toast';

interface ResetPasswordProps {
  token: string;
  email: string;
}

const ResetPassword = ({ token, email }: ResetPasswordProps) => {
  const t = useTranslations('Auth.ResetPassword.Form');
  const ts = useTranslations('Common.Success');
  const te = useTranslations('Common.Errors');
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isVisiblePassword, setIsVisiblePassword] = useState<boolean>(false);
  const [isVisiblePasswordConfirmation, setIsVisiblePasswordConfirmation] =
    useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty, touchedFields },
  } = useForm<AuthSchema.ResetPasswordFormData>({
    resolver: zodResolver(AuthSchema.resetPasswordFormSchema),
    defaultValues: {
      password: '',
      passwordConfirmation: '',
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const toggleVisibilityPassword = () => setIsVisiblePassword(!isVisiblePassword);
  const toggleVisibilityPasswordConfirmation = () =>
    setIsVisiblePasswordConfirmation(!isVisiblePasswordConfirmation);

  const resetPassword = trpc.auth.resetPassword.useMutation({});

  const onSubmit = async (data: AuthSchema.ResetPasswordFormData) => {
    try {
      const response = await resetPassword.mutateAsync({ email, password: data.password, token });
      showToast.success(ts(response.message));
      setIsSuccess(true);

      setTimeout(() => {
        router.push(`/auth/sign-in?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (error: any) {
      showToast.error(getLocalizedError(error.message, te));
    }
  };

  return (
    <div className="w-full max-w-full flex-col items-center gap-6 md:max-w-105 md:pl-4 lg:pl-0">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Password */}
        <Input
          {...register('password')}
          variant="bordered"
          label={t('passwordLabel')}
          placeholder={t('passwordPlaceholder')}
          id="password"
          type={isVisiblePassword ? 'text' : 'password'}
          isDisabled={resetPassword.isPending}
          isInvalid={(!!errors.password && touchedFields.password) ?? false}
          errorMessage={
            errors.password && touchedFields.password
              ? getLocalizedError(errors.password?.message, te)
              : null
          }
          classNames={{
            base: 'h-[90px]',
            inputWrapper: [
              'border-1',
              'border-gray-300/30',
              'group-data-[focus=true]:border-brand-500!',
              'group-data-[hover=true]:border-brand-500',
            ],
            input: ['!outline-none'],
          }}
          endContent={
            <button
              className="focus:outline-none"
              type="button"
              onClick={toggleVisibilityPassword}
              aria-label={isVisiblePassword ? 'Hide password' : 'Show password'}
            >
              {isVisiblePassword ? (
                <IoEyeOutline size={30} className="flex pb-2 text-gray-400" />
              ) : (
                <IoEyeOffOutline size={30} className="flex pb-2 text-gray-400" />
              )}
            </button>
          }
        />
        {/* Password Confirmation */}
        <Input
          {...register('passwordConfirmation')}
          variant="bordered"
          label={t('confirmPasswordLabel')}
          placeholder={t('confirmPasswordPlaceholder')}
          type={isVisiblePasswordConfirmation ? 'text' : 'password'}
          isDisabled={resetPassword.isPending}
          isInvalid={(!!errors.passwordConfirmation && touchedFields.passwordConfirmation) ?? false}
          errorMessage={
            errors.passwordConfirmation && touchedFields.passwordConfirmation
              ? getLocalizedError(errors.passwordConfirmation?.message, te)
              : null
          }
          classNames={{
            base: 'h-[90px]',
            inputWrapper: [
              'border-1',
              'border-gray-300/30',
              'group-data-[focus=true]:border-brand-500!',
              'group-data-[hover=true]:border-brand-500',
            ],
            input: ['!outline-none'],
          }}
          endContent={
            <button
              className="focus:outline-none"
              type="button"
              onClick={toggleVisibilityPasswordConfirmation}
              aria-label={isVisiblePasswordConfirmation ? 'Hide password' : 'Show password'}
            >
              {isVisiblePasswordConfirmation ? (
                <IoEyeOutline size={30} className="flex pb-2 text-gray-400" />
              ) : (
                <IoEyeOffOutline size={30} className="flex pb-2 text-gray-400" />
              )}
            </button>
          }
        />

        <Button
          type="submit"
          disabled={!isValid || resetPassword.isPending || isSuccess || !isDirty}
          isLoading={resetPassword.isPending || isSuccess}
          spinner={<LoadingSpinner />}
          className="bg-brand-500 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 dark:hover:bg-brand-300 dark:active:bg-brand-200 w-full rounded-xl py-3 text-base font-medium text-white transition duration-200 dark:text-white"
        >
          {t('submitButton')}
        </Button>
      </form>
    </div>
  );
};

export default ResetPassword;
