import { getEmailTranslations } from '@package/i18n';

import { env } from '../config/env';
import { sendEmail } from './nodemailer/sendEmail';

type MailInput = { to: string; name: string | null; link: string; locale: string };

export const mailer = {
  async sendVerificationEmail({ to, name, link, locale }: MailInput): Promise<void> {
    const t = await getEmailTranslations(locale, 'verify');
    await sendEmail({
      email: to,
      payload: { link, name, appName: env.APP_NAME, t, lang: locale },
      template: '/templates/verifyEmail.handlebars',
      subject: t.subject,
    });
  },

  async sendPasswordReset({ to, name, link, locale }: MailInput): Promise<void> {
    const t = await getEmailTranslations(locale, 'resetPassword');
    await sendEmail({
      email: to,
      payload: { link, name, appName: env.APP_NAME, t, lang: locale },
      template: '/templates/forgotPasswordEmail.handlebars',
      subject: t.subject,
    });
  },

  async sendPasswordChanged({ to, name, link, locale }: MailInput): Promise<void> {
    const raw = await getEmailTranslations(locale, 'passwordChanged');
    const t = { ...raw, description: raw.description.replace('{{appName}}', env.APP_NAME) };
    await sendEmail({
      email: to,
      payload: { link, name, appName: env.APP_NAME, t, lang: locale },
      template: '/templates/passwordUpdatedConfirmation.handlebars',
      subject: t.subject,
    });
  },

  async sendInvite({
    to,
    role,
    link,
    locale,
  }: {
    to: string;
    role: string;
    link: string;
    locale: string;
  }): Promise<void> {
    const t = await getEmailTranslations(locale, 'verify');
    const subject = t.subject.includes('{{appName}}')
      ? t.subject.replace('{{appName}}', env.APP_NAME)
      : t.subject;
    await sendEmail({
      email: to,
      payload: { link, role, appName: env.APP_NAME, t, lang: locale },
      template: '/templates/inviteEmail.handlebars',
      subject,
    });
  },
};
