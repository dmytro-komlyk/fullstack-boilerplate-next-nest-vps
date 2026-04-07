import authEn from './locales/en/auth.json';
import commonEn from './locales/en/common.json';
import emailEn from './locales/en/email.json';

export const supportedLanguages = ['en', 'uk'] as const;
export type Language = (typeof supportedLanguages)[number];

export const defaultLanguage: Language = 'en';

export type I18nTranslations = {
  Auth: typeof authEn;
  Common: typeof commonEn;
};

export const languageNames: Record<Language, string> = {
  en: 'English',
  uk: 'Українська',
};

export const getMessagesForLocale = async (locale: string) => {
  try {
    return {
      Auth: (await import(`./locales/${locale}/auth.json`)).default,
      Common: (await import(`./locales/${locale}/common.json`)).default,
      Email: (await import(`./locales/${locale}/email.json`)).default,
    };
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    return {
      Auth: authEn,
      Common: commonEn,
      Email: emailEn,
    };
  }
};

export const getEmailTranslations = async (
  locale: string,
  type: 'verify' | 'resetPassword' | 'passwordChanged'
) => {
  const messages = await getMessagesForLocale(locale);
  return messages.Email[type];
};
