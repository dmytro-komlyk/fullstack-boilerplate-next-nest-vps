import aiEn from './locales/en/ai.json';
import authEn from './locales/en/auth.json';
import commonEn from './locales/en/common.json';
import emailEn from './locales/en/email.json';
import homeEn from './locales/en/home.json';
import userEn from './locales/en/user.json';
import aiUk from './locales/uk/ai.json';
import authUk from './locales/uk/auth.json';
import commonUk from './locales/uk/common.json';
import emailUk from './locales/uk/email.json';
import homeUk from './locales/uk/home.json';
import userUk from './locales/uk/user.json';

export const supportedLanguages = ['en', 'uk'] as const;
export type Language = (typeof supportedLanguages)[number];

export const defaultLanguage: Language = 'en';

export type I18nTranslations = {
  Home: typeof homeEn;
  Auth: typeof authEn;
  Common: typeof commonEn;
  User: typeof userEn;
  Email: typeof emailEn;
  AI: typeof aiEn;
};

export const languageNames: Record<Language, string> = {
  en: 'English',
  uk: 'Українська',
};

export const getMessagesForLocale = async (locale: string) => {
  try {
    return {
      Home: (await import(`./locales/${locale}/home.json`)).default,
      Auth: (await import(`./locales/${locale}/auth.json`)).default,
      Common: (await import(`./locales/${locale}/common.json`)).default,
      Email: (await import(`./locales/${locale}/email.json`)).default,
      User: (await import(`./locales/${locale}/user.json`)).default,
      AI: (await import(`./locales/${locale}/ai.json`)).default,
    };
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    return {
      Home: homeEn,
      Auth: authEn,
      Common: commonEn,
      Email: emailEn,
      User: userEn,
      AI: aiEn,
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

export {
  aiEn,
  aiUk,
  authEn,
  authUk,
  commonEn,
  commonUk,
  emailEn,
  emailUk,
  homeEn,
  homeUk,
  userEn,
  userUk,
};
