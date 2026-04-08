'use client';

import { showToast } from '@/components/Toast';
import { Button, Input } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthSchema, trpc } from '@package/api';
import { getLocalizedError } from 'i18n/error-handler';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

const ChangePasswordForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const t = useTranslations('Auth.ChangeForcedPassword.Form');
  const ts = useTranslations('Common.Success');
  const te = useTranslations('Common.Errors');

  const { update, data: session } = useSession();
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(AuthSchema.resetPasswordFormSchema),
  });

  const changeForcedPassword = trpc.auth.changeForcedPassword.useMutation({});

  const onSubmit = async (data: AuthSchema.ResetPasswordFormData) => {
    try {
      const response = await changeForcedPassword.mutateAsync({
        password: data.password,
      });

      if (response.success) {
        await update({
          ...session,
          user: {
            ...session?.user,
            forcePasswordChange: false,
          },
        });
        showToast.success(ts(response.message));
        onSuccess();
      }
    } catch (error: any) {
      showToast.error(getLocalizedError(error.message, te));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        {...register('password')}
        type="password"
        label={t('passwordLabel')}
        variant="bordered"
        errorMessage={getLocalizedError(errors.password?.message as string, te)}
        isInvalid={!!errors.password}
      />
      <Input
        {...register('passwordConfirmation')}
        type="password"
        label={t('confirmPasswordLabel')}
        variant="bordered"
        errorMessage={getLocalizedError(errors.passwordConfirmation?.message as string, te)}
        isInvalid={!!errors.passwordConfirmation}
      />
      <Button
        type="submit"
        color="primary"
        isLoading={changeForcedPassword.isPending}
        isDisabled={changeForcedPassword.isPending || !isValid}
        className="bg-navy-700 dark:bg-brand-600 font-bold h-12 rounded-xl"
      >
        {t('submitButton')}
      </Button>
    </form>
  );
};

export default ChangePasswordForm;
