import fs from 'node:fs/promises';
import path from 'node:path';

import handlebars from 'handlebars';
import nodemailer, { type Transporter } from 'nodemailer';

import { env } from '../../config/env';

type EmailPayload = {
  link: string;
  name?: string | null;
  appName: string;
  lang: string;
  t: Record<string, string>;
  [key: string]: unknown;
};

const TEMPLATES_DIR = path.join(process.cwd(), 'src/utils/nodemailer');

let _transporter: Transporter | null = null;

const getTransporter = (): Transporter => {
  if (_transporter) return _transporter;

  const { SMTP_DOMAIN, SMTP_PORT, SMTP_TO_EMAIL, SMTP_TO_PASSWORD } = env;

  if (!SMTP_DOMAIN || !SMTP_TO_EMAIL || !SMTP_TO_PASSWORD) {
    throw new Error(
      'SMTP is not configured. Set SMTP_DOMAIN, SMTP_TO_EMAIL, and SMTP_TO_PASSWORD.'
    );
  }

  _transporter = nodemailer.createTransport({
    host: SMTP_DOMAIN,
    port: SMTP_PORT ?? 587,
    auth: { user: SMTP_TO_EMAIL, pass: SMTP_TO_PASSWORD },
  });

  return _transporter;
};

export const sendEmail = async ({
  email,
  payload,
  template,
  subject,
}: {
  email: string;
  payload: EmailPayload;
  template: string;
  subject: string;
}): Promise<void> => {
  const templatePath = path.join(TEMPLATES_DIR, template);

  await fs.access(templatePath, fs.constants.F_OK).catch(() => {
    throw new Error(`Email template not found: ${templatePath}`);
  });

  const source = await fs.readFile(templatePath, 'utf8');
  const html = handlebars.compile(source)(payload);

  await getTransporter().sendMail({
    from: env.SMTP_FROM_EMAIL,
    to: email,
    subject,
    html,
  });
};
