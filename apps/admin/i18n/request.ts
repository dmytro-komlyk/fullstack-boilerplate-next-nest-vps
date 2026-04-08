import { getMessagesForLocale, supportedLanguages, type Language } from '@package/i18n';
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  if (!locale) {
    notFound();
  }

  if (!supportedLanguages.includes(locale as Language)) {
    console.log('Locale not supported:', locale);
    notFound();
  }

  const messages = await getMessagesForLocale(locale);

  return {
    locale,
    messages,
    timeZone: 'Europe/Kiev',
  };
});
