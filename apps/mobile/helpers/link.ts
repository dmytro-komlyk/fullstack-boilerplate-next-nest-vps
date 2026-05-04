import * as WebBrowser from 'expo-web-browser';
import i18next from 'i18next';

import { WEB_URL } from '@/keys';

export const openExternalLink = async (path: string) => {
  const currentLocale = i18next.language || 'en';
  const urlWithLocale = `${WEB_URL}/${currentLocale}${path}?from=mobile`; // added them to track that user came from mobile;
  await WebBrowser.openBrowserAsync(urlWithLocale);
};
