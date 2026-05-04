import {
  authEn,
  authUk,
  commonEn,
  commonUk,
  defaultLanguage,
  homeEn,
  homeUk,
  supportedLanguages,
  type Language,
} from '@package/i18n';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const deviceLanguage = Localization.getLocales()[0].languageCode as Language;
const lng = supportedLanguages.includes(deviceLanguage) ? deviceLanguage : defaultLanguage;

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        Home: homeEn,
        Auth: authEn,
        Common: commonEn,
      },
    },
    uk: {
      translation: {
        Home: homeUk,
        Auth: authUk,
        Common: commonUk,
      },
    },
  },
  lng: lng,
  fallbackLng: defaultLanguage,
  interpolation: {
    escapeValue: false,
    prefix: '{',
    suffix: '}',
  },
  compatibilityJSON: 'v4',
});

export default i18n;
