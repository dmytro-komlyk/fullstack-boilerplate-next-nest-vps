'use client';

import { showToast } from '@/components/Toast';
import { appName } from '@/utils/constants';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';

const AuthFeedbackWatcher = () => {
  const searchParams = useSearchParams();
  const hasShown = useRef<string | null>(null);

  const ts = useTranslations('Common.Success');
  const te = useTranslations('Common.Errors');

  useEffect(() => {
    const toastType = searchParams.get('toast');

    if (!toastType || hasShown.current === toastType) return;

    switch (toastType) {
      case 'welcome':
        showToast.success(ts('welcomeBack', { appName }));
        break;
      case 'logout_success':
        showToast.success(ts('logoutSuccess'));
        break;
      case 'session_expired':
        showToast.error(te('sessionExpired'));
        break;
      default:
        return;
    }

    hasShown.current = toastType;

    const url = new URL(window.location.href);
    url.searchParams.delete('toast');
    window.history.replaceState({}, '', url.pathname + url.search);
  }, [searchParams, ts, te]);

  return null;
};

export default function AuthFeedbackHandler() {
  return (
    <Suspense fallback={null}>
      <AuthFeedbackWatcher />
    </Suspense>
  );
}
