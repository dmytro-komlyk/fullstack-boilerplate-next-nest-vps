'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { TbKey, TbShieldCheck } from 'react-icons/tb';
import ChangePasswordForm from './ChangePasswordForm';
import TwoFactor from './TwoFactor';

const OnboardingClient = ({ initialStep }: { user: any; initialStep: 'PASSWORD' | '2FA' }) => {
  const t = useTranslations('Auth.Onboarding');
  const [step, setStep] = useState<'PASSWORD' | '2FA'>(initialStep);

  return (
    <div className="relative flex h-full w-full items-center justify-center px-4">
      <div className="z-10 w-full max-w-112.5 overflow-hidden rounded-3xl border-1 border-navy-700/10 bg-white/80 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-navy-900/90">
        <div
          className={`flex items-center justify-between px-8 py-3 transition-colors duration-500 ${step === 'PASSWORD' ? 'bg-amber-500' : 'bg-green-600'}`}
        >
          <div className="flex items-center gap-2">
            {step === 'PASSWORD' ? (
              <TbKey className="text-white" />
            ) : (
              <TbShieldCheck className="text-white" />
            )}
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
              {step === 'PASSWORD' ? t('steps.password') : t('steps.twoFactor')}
            </span>
          </div>
          <div className="flex gap-1.5">
            <div
              className={`size-2 rounded-full transition-all ${step === 'PASSWORD' ? 'bg-white' : 'bg-white/20'}`}
            />
            <div
              className={`size-2 rounded-full transition-all ${step === '2FA' ? 'bg-white' : 'bg-white/20'}`}
            />
          </div>
        </div>

        <div className="p-8 md:p-10">
          <AnimatePresence mode="wait">
            {step === 'PASSWORD' ? (
              <motion.div
                key="password"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <h3 className="mb-2 text-3xl font-black tracking-tight text-navy-800 dark:text-white">
                  {t('PasswordStep.title')}
                </h3>
                <p className="mb-8 text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('PasswordStep.description')}
                </p>
                <ChangePasswordForm onSuccess={() => setStep('2FA')} />
              </motion.div>
            ) : (
              <motion.div
                key="2fa"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <h3 className="mb-2 text-3xl font-black tracking-tight text-navy-800 dark:text-white">
                  {t('TwoFactorStep.title')}
                </h3>
                <p className="mb-8 text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('TwoFactorStep.description')}
                </p>
                <TwoFactor mode="setup" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default OnboardingClient;
