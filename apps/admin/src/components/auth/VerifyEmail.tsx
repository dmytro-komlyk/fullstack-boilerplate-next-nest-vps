'use client';

import { Button, Input } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthSchema, trpc } from '@package/api';
import { getLocalizedError } from 'i18n/error-handler';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { MdDone, MdErrorOutline } from 'react-icons/md';
import { showToast } from '../Toast';

interface VerifyEmailProps {
  token: string;
  email: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

const VerifyEmail = ({ token, email }: VerifyEmailProps) => {
  const t = useTranslations('Auth.VerifyEmail.Form');
  const ts = useTranslations('Common.Success');
  const te = useTranslations('Common.Errors');
  const router = useRouter();
  const isMounted = useRef(false);
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'idle');

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
  } = useForm<AuthSchema.ResendVerificationEmailData>({
    resolver: zodResolver(AuthSchema.resendVerificationEmailSchema),
    defaultValues: {
      email: email || '',
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const verifyEmail = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setStatus('success');
      showToast.success(ts('emailVerified'));
      setTimeout(() => router.push('/auth/sign-in'), 2000);
    },
    onError: (error) => {
      setStatus('error');
      showToast.error(getLocalizedError(error.message, te));
    },
  });
  const resendVerification = trpc.auth.resendVerification.useMutation({});

  useEffect(() => {
    if (!token || !email || isMounted.current) return;

    isMounted.current = true;
    verifyEmail.mutate({ token, email });
  }, [token, email]);

  const onSubmit = async (data: AuthSchema.ResendVerificationEmailData) => {
    setStatus('idle');
    try {
      const response = await resendVerification.mutateAsync({ email: data.email });
      showToast.success(ts(response.message));
    } catch (error: any) {
      showToast.error(getLocalizedError(error.message, te));
    }
  };

  const renderEndContent = () => {
    if (status === 'success') {
      return <MdDone className="text-2xl text-green-500" />;
    }
    if (status === 'error') {
      return <MdErrorOutline className="text-2xl text-red-500" />;
    }
    return null;
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
          isReadOnly={true}
          isDisabled={resendVerification.isPending}
          isInvalid={(!!errors.email && touchedFields.email) ?? false}
          errorMessage={
            errors.email && touchedFields.email
              ? getLocalizedError(errors.email?.message, te)
              : null
          }
          endContent={renderEndContent()}
          classNames={{
            base: 'h-[90px]',
            inputWrapper: [
              'border-1',
              'border-gray-300/30',
              'group-data-[focus=true]:border-brand-500',
              'group-data-[hover=true]:border-brand-500!',
              status === 'success' && 'border-green-500/50',
              status === 'error' && 'border-red-500/50',
            ],
            input: ['!outline-none'],
          }}
        />

        <Button
          type="submit"
          fullWidth
          color="primary"
          isLoading={resendVerification.isPending}
          isDisabled={status === 'success' || !isValid || resendVerification.isPending}
          className="bg-brand-500 text-white font-medium"
        >
          {t('submitButton')}
        </Button>
      </form>
    </div>
  );
};

export default VerifyEmail;
