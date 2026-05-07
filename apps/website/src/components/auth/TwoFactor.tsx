'use client';

import LoadingSpinner from '@/components/loading/LoadingSpinner';
import { baseUrl } from '@/utils/constants';
import {
  Button,
  InputOtp,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Snippet,
  useDisclosure,
} from '@heroui/react';
import { trpc } from '@package/api/client';
import { getLocalizedError } from '@/i18n/error-handler';
import { signOut, useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { showToast } from '../Toast';

interface FormValues {
  otp: string;
}

export default function TwoFactor({ mode = 'verify' }: { mode?: 'setup' | 'verify' }) {
  const router = useRouter();
  const t = useTranslations('Auth.TwoFactor.Form');
  const tm = useTranslations('Auth.TwoFactor.Modal');
  const ts = useTranslations('Common.Success');
  const te = useTranslations('Common.Errors');

  const [isActivated, setIsActivated] = useState(false);
  const [isBackupMode, setIsBackupMode] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const { data: session, update } = useSession();

  useEffect(() => {
    if (mode !== 'verify') return;
    const mfaToken = session?.user?.mfaToken;
    if (!mfaToken) return;
    try {
      const payload = JSON.parse(atob(mfaToken.split('.')[1]!));
      const delay = payload.exp * 1000 - Date.now();
      if (delay <= 0) {
        signOut({ callbackUrl: '/auth/sign-in?toast=session_expired' });
        return;
      }
      const timer = setTimeout(() => {
        signOut({ callbackUrl: '/auth/sign-in?toast=session_expired' });
      }, delay);
      return () => clearTimeout(timer);
    } catch {
      // malformed token — ignore, will fail on submit
    }
  }, [mode, session?.user?.mfaToken]);

  const { data: setupData, isLoading: isSetupLoading } = trpc.auth.setup2FA.useQuery(undefined, {
    enabled: mode === 'setup' && !isActivated,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const verifyMutation = trpc.auth.verify2FA.useMutation({});
  const activateMutation = trpc.auth.activate2FA.useMutation({});

  const {
    handleSubmit,
    control,
    resetField,
    formState: { isValid },
  } = useForm<FormValues>({
    defaultValues: { otp: '' },
    mode: 'onChange',
  });

  const toggleMode = () => {
    setIsBackupMode(!isBackupMode);
    resetField('otp');
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (mode === 'setup') {
        const data = await activateMutation.mutateAsync({ code: values.otp });
        setIsActivated(true);

        if (data.backupCodes?.length) {
          setBackupCodes(data.backupCodes);
          onOpen();
        } else {
          await update({
            user: {
              ...session?.user,
              isTwoFactorEnabled: true,
              twoFactorSetupPending: false,
            },
          });
          window.location.href = '/dashboard';
        }
      } else {
        const data = await verifyMutation.mutateAsync({
          code: values.otp,
          mfaToken: session?.user?.mfaToken || '',
        });

        if (data.status === 'SUCCESS') {
          showToast.success(ts('twoFactorVerify'));
          await update({
            user: {
              ...session?.user,
              requires2FA: false,
              accessToken: data.accessToken,
              sessionToken: data.sessionToken,
            },
          });
          window.location.href = `${baseUrl}/dashboard?toast=welcome`;
        }
      }
    } catch (error: any) {
      if (error.message === 'tokenExpired' || error.message === 'invalidToken') {
        showToast.error(te('sessionExpired'));
        signOut({ callbackUrl: '/auth/sign-in?toast=session_expired' });
        return;
      }
      showToast.error(getLocalizedError(error.message, te));
    }
  };

  const handleDone = async () => {
    await update({
      user: {
        ...session?.user,
        isTwoFactorEnabled: true,
        twoFactorSetupPending: false,
      },
    });
    router.push('/dashboard');
  };

  const isLoading = verifyMutation.isPending || activateMutation.isPending;

  return (
    <div className="w-full max-w-full flex flex-col items-center gap-6 md:max-w-105 md:pl-4 lg:pl-0">
      {mode === 'setup' && (
        <div className="w-full flex flex-col items-center gap-4 rounded-2xl bg-gray-50/50 p-6 dark:bg-white/5 border border-gray-300/30">
          {isSetupLoading ? (
            <div className="h-40 w-40 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          ) : (
            <>
              <div className="rounded-xl bg-white p-3 shadow-sm border border-gray-300/30">
                {setupData?.qrCodeUrl && (
                  <Image
                    width={200}
                    height={200}
                    src={setupData.qrCodeUrl}
                    alt="2FA QR Code"
                    className="rounded-lg"
                  />
                )}
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {t('manualKey')}
                </p>
                <code className="text-sm font-mono font-bold text-brand-500">
                  {setupData?.secret}
                </code>
              </div>
            </>
          )}
        </div>
      )}

      <form className="flex flex-col gap-6 w-full" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-2 text-center">
          <label className="text-sm font-medium text-navy-700 dark:text-gray-500">
            {isBackupMode
              ? t('labelBackup')
              : mode === 'setup'
                ? t('labelSetup')
                : t('labelVerify')}
          </label>
        </div>

        <Controller
          control={control}
          name="otp"
          render={({ field }) => (
            <InputOtp
              {...field}
              length={isBackupMode ? 8 : 6}
              variant="bordered"
              classNames={{
                base: 'mx-auto',
                wrapper: 'justify-center gap-2',
                segment: [
                  'w-11 h-14 text-xl font-bold border-1 rounded-xl',
                  'border-gray-300/30 bg-transparent',
                  'group-data-[focus=true]:border-brand-500!',
                  'group-data-[hover=true]:border-brand-500',
                  'text-navy-700 dark:text-white',
                ],
              }}
            />
          )}
          rules={{
            required: t('otpRequired'),
            minLength: {
              value: isBackupMode ? 8 : 6,
              message: t('otpMinLength', { count: isBackupMode ? 8 : 6 }),
            },
          }}
        />

        <div className="flex flex-col gap-3">
          <Button
            type="submit"
            disabled={!isValid || isLoading}
            isLoading={isLoading}
            spinner={<LoadingSpinner />}
            className="bg-brand-500 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 dark:hover:bg-brand-300 dark:active:bg-brand-200 w-full rounded-xl py-3 text-base font-medium text-white transition duration-200"
          >
            {isBackupMode
              ? t('btnVerifyBackup')
              : mode === 'setup'
                ? t('btnActivate')
                : t('btnAuthorize')}
          </Button>

          {mode === 'verify' && (
            <div className="flex justify-center">
              <Button
                variant="light"
                size="sm"
                className="p-0 text-brand-500 hover:text-brand-600 text-sm font-medium dark:text-white data-[hover=true]:bg-transparent"
                onPress={toggleMode}
              >
                {isBackupMode ? t('backToStandard') : t('lostAccess')}
              </Button>
            </div>
          )}
        </div>
      </form>

      {/* Modal remains largely the same but with brand button */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        isDismissable={false}
        hideCloseButton
        backdrop="blur"
      >
        <ModalContent className="dark:bg-navy-900 rounded-2xl">
          {() => (
            <>
              <ModalHeader className="text-xl font-bold text-navy-700 dark:text-white">
                {tm('title')}
              </ModalHeader>
              <ModalBody>
                <div
                  className="rounded-xl bg-amber-50 p-4 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-500/30 mb-4 text-sm"
                  dangerouslySetInnerHTML={{ __html: tm.raw('warning') }}
                />
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code) => (
                    <Snippet
                      key={code}
                      hideSymbol
                      variant="flat"
                      className="bg-gray-50 dark:bg-white/5 font-mono rounded-lg"
                    >
                      {code}
                    </Snippet>
                  ))}
                </div>
              </ModalBody>
              <ModalFooter className="flex flex-col gap-2">
                <Button
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium h-12 rounded-xl"
                  onPress={handleDone}
                >
                  {tm('btnDone')}
                </Button>
                <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest">
                  {tm('footerNote')}
                </p>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
