import fs from 'fs/promises';
import handlebars from 'handlebars';
import nodemailer from 'nodemailer';
import path from 'path';

interface EmailPayload {
  link: string;
  name?: string | null;
  appName: string;
  lang: string;
  t: Record<string, any>;
  [key: string]: any;
}

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
  try {
    const requiredEnvVars = [
      'SMTP_DOMAIN',
      'SMTP_PORT',
      'SMTP_TO_EMAIL',
      'SMTP_TO_PASSWORD',
      'SMTP_FROM_EMAIL',
    ];

    const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

    if (missingEnvVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }

    if (!nodemailer || typeof nodemailer.createTransport !== 'function') {
      throw new Error('Nodemailer is not properly imported or initialized');
    }

    // create reusable transporter object using the default SMTP transport
    const transport = {
      host: process.env.SMTP_DOMAIN,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_TO_EMAIL,
        pass: process.env.SMTP_TO_PASSWORD, // naturally, replace both with your real credentials or an application-specific password
      },
    };
    const transporter = nodemailer.createTransport(transport);

    await new Promise((resolve, reject) => {
      transporter.verify((error: Error | null) => {
        if (error) {
          console.error('SMTP verification error:', error);
          reject(error);
        } else {
          console.log('SMTP connection verified successfully');
          resolve(true);
        }
      });
    });

    const currentPath = process.cwd();
    const updatedPath = currentPath.replace(/\/client$/, '/server');
    const templatePath = path.join(updatedPath, '/src/utils/nodemailer', template);

    await fs.access(templatePath, fs.constants.F_OK).catch(() => {
      throw new Error(`Template file not found at: ${templatePath}`);
    });

    const source = await fs.readFile(templatePath, 'utf8');
    const compiledTemplate = handlebars.compile(source);

    const mail = {
      from: process.env.SMTP_FROM_EMAIL,
      to: email,
      subject: subject,
      html: compiledTemplate(payload),
    };
    // Send email
    const info = await transporter.sendMail(mail);
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.log(error);
  }
};
