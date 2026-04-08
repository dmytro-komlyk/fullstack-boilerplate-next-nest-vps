export const getLocalizedError = (rawError: string | undefined | null, te: any): string => {
  if (!rawError) return '';

  try {
    if (rawError.includes('|')) {
      const [key, value] = rawError.split('|');

      return te(key as any, {
        count: value,
        seconds: value,
        minutes: value,
        providers: value,
      });
    }

    return te(rawError as any);
  } catch {
    console.warn(`[I18n] Missing translation for: ${rawError}`);

    if (rawError === 'CredentialsSignin') return te('invalidCredentials');

    return rawError;
  }
};
