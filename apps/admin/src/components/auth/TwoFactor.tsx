'use client';

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
import { getLocalizedError } from 'i18n/error-handler';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
    defaultValues: {
      otp: '',
    },
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

        await update({
          user: { ...session?.user, isTwoFactorEnabled: true },
        });

        if (data.backupCodes) {
          setBackupCodes(data.backupCodes);
          onOpen();
        } else {
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
      console.log(error.message);

      if (error.message === 'tokenExpired' || error.message === 'invalidToken') {
        showToast.error(te('sessionExpired'));
        setTimeout(() => {
          window.location.href = '/auth/sign-in?toast=session_expired';
        }, 1500);
        return;
      }

      showToast.error(getLocalizedError(error.message, te));
    }
  };

  const handleDone = () => {
    router.push('/dashboard');
  };

  const isLoading = verifyMutation.isPending || activateMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      {mode === 'setup' && (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-gray-50 p-6 dark:bg-white/5 border border-dashed border-navy-200 dark:border-white/10">
          {isSetupLoading ? (
            <div className="h-40 w-40 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          ) : (
            <>
              <div className="rounded-xl bg-white p-3 shadow-sm">
                {setupData && setupData.qrCodeUrl && (
                  <Image
                    width={200}
                    height={200}
                    src={setupData.qrCodeUrl}
                    alt="2FA QR Code"
                    className="rounded-lg border-2"
                  />
                )}
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {t('manualKey')}
                </p>
                <code className="text-sm font-mono font-bold text-navy-700 dark:text-brand-400">
                  {setupData?.secret}
                </code>
              </div>
            </>
          )}
        </div>
      )}

      <form className="flex flex-col gap-6 w-full" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-2 text-center">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
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
                wrapper: 'justify-center',
                base: 'w-full justify-between',
                segment:
                  'w-10 h-12 text-lg font-bold border-2 rounded-xl bg-white dark:bg-navy-900',
                segmentWrapper: 'gap-2',
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
            color={isBackupMode ? 'warning' : 'primary'}
            isLoading={isLoading}
            isDisabled={isLoading || !isValid}
            className="bg-navy-700 dark:bg-brand-600 font-bold h-14 rounded-xl text-lg shadow-lg shadow-brand-500/20"
          >
            {isBackupMode
              ? t('btnVerifyBackup')
              : mode === 'setup'
                ? t('btnActivate')
                : t('btnAuthorize')}
          </Button>
          {mode === 'verify' && (
            <Button
              variant="light"
              size="sm"
              className="text-gray-500 hover:text-navy-700 dark:hover:text-white"
              onPress={toggleMode}
            >
              {isBackupMode ? t('backToStandard') : t('lostAccess')}
            </Button>
          )}
        </div>
      </form>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        isDismissable={false}
        hideCloseButton
        backdrop="blur"
        className="dark:bg-navy-900"
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-xl font-bold text-navy-700 dark:text-white">
                {tm('title')}
              </ModalHeader>
              <ModalBody>
                <div
                  className="rounded-xl bg-amber-50 p-4 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-500/30 mb-4"
                  dangerouslySetInnerHTML={{ __html: tm.raw('warning') }}
                />

                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code) => (
                    <Snippet
                      key={code}
                      hideSymbol
                      variant="flat"
                      className="bg-gray-50 dark:bg-white/5 font-mono"
                    >
                      {code}
                    </Snippet>
                  ))}
                </div>
              </ModalBody>
              <ModalFooter className="flex flex-col gap-2">
                <Button
                  color="primary"
                  className="w-full bg-navy-700 dark:bg-brand-600 font-bold h-12"
                  onClick={handleDone}
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
