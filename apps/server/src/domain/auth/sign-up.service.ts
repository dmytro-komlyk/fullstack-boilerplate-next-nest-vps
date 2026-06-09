import crypto from 'node:crypto';

import { prisma } from '@package/prisma';
import { TRPCError } from '@trpc/server';
import { hash } from 'bcryptjs';

import { env } from '../../config/env';
import { mailer } from '../../utils/mailer';
import { Domain } from '../trpc/trpc.context';
import { RATE_LIMIT_COOLDOWN_MINUTES } from './auth.constants';
import {
  CheckTokenData,
  InviteUserData,
  OutputCheckTokenData,
  OutputInviteData,
  ResendVerificationEmailData,
  SignUpData,
  SignUpResponseData,
  UserRole,
  VerifyEmailOutputData,
} from './auth.schema';
import { issueVerificationToken } from './token.helper';

export const signUp = async ({
  domain,
  data,
}: {
  domain: Domain;
  data: SignUpData & { inviteToken?: string };
}): Promise<SignUpResponseData> => {
  const isAdminHost = domain.origin?.includes('admin');
  let assignedRole: UserRole = 'USER';

  if (isAdminHost) {
    if (!data.inviteToken) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'requireInvitation' });
    }

    const invite = await prisma.invite.findUnique({
      where: {
        token: data.inviteToken,
        email: data.email,
        isAccepted: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!invite) throw new TRPCError({ code: 'BAD_REQUEST', message: 'invalidInvitation' });

    assignedRole = invite.role;
  }

  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });

  if (existingUser) {
    if (existingUser.emailVerified) {
      throw new TRPCError({ code: 'CONFLICT', message: 'userAlreadyExists' });
    }

    const token = await issueVerificationToken({
      email: data.email,
      userId: existingUser.id,
      type: 'EMAIL_VERIFICATION',
    });
    const link = `${domain.origin || env.APP_WEBSITE_URL}/auth/verify-email?token=${token}&email=${data.email}`;
    await mailer.sendVerificationEmail({
      to: data.email,
      name: existingUser.nickName,
      link,
      locale: domain.locale,
    });

    return { success: true, message: 'verificationEmailSent', userId: existingUser.id };
  }

  const hashedPassword = await hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      nickName: data.nickName,
      role: assignedRole,
      status: 'PENDING',
      emailVerified: null,
      twoFactorSetupPending: data.twoFactorSetupPending,
    },
  });

  const token = await issueVerificationToken({
    email: data.email,
    userId: user.id,
    type: 'EMAIL_VERIFICATION',
  });
  const link = `${domain.origin || env.APP_WEBSITE_URL}/auth/verify-email?token=${token}&email=${data.email}`;
  await mailer.sendVerificationEmail({
    to: data.email,
    name: user.nickName,
    link,
    locale: domain.locale,
  });

  return { success: true, message: 'registrationUser', userId: user.id };
};

export const verifyEmail = async (input: {
  token: string;
  email: string;
}): Promise<VerifyEmailOutputData> => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'userNotFound' });

  if (user.emailVerified) {
    return { success: true, message: 'emailAlreadyVerified', userId: user.id };
  }

  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      identifier: input.email,
      token: input.token,
      type: 'EMAIL_VERIFICATION',
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!verificationToken || !verificationToken.user) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'invalidVerificationToken' });
  }

  await prisma.user.update({
    where: { id: verificationToken.user.id },
    data: { emailVerified: new Date(), status: 'ACTIVE' },
  });

  await prisma.verificationToken.deleteMany({
    where: { token: input.token, identifier: input.email, type: 'EMAIL_VERIFICATION' },
  });

  return {
    success: true,
    message: 'emailVerified',
    twoFactorSetupPending: user.twoFactorSetupPending,
    userId: verificationToken.user.id,
  };
};

export const verifyToken = async (input: CheckTokenData): Promise<OutputCheckTokenData> => {
  const tokenRecord = await prisma.verificationToken.findFirst({
    where: { token: input.token },
    include: { user: true },
  });

  if (!tokenRecord || !tokenRecord.user) {
    return { success: false, message: 'invalidResetLink' };
  }

  if (tokenRecord.expiresAt < new Date()) {
    return { success: false, email: tokenRecord.user.email as string, message: 'invalidResetLink' };
  }

  return { success: true, email: tokenRecord.user.email as string, message: 'validToken' };
};

export const resendVerification = async ({
  data,
  domain,
}: {
  data: ResendVerificationEmailData;
  domain: Domain;
}): Promise<VerifyEmailOutputData> => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: {
      verificationTokens: {
        where: { type: 'EMAIL_VERIFICATION' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  const isAdminHost = domain.origin?.includes('admin');

  if (user && isAdminHost && user.role === 'USER')
    return { success: true, message: 'verificationEmailSent' };
  if (!user) return { success: true, message: 'verificationEmailSent' };
  if (user.emailVerified) return { success: false, message: 'emailAlreadyVerified' };

  const lastToken = user.verificationTokens?.[0];

  if (lastToken) {
    const diffInMinutes = (Date.now() - lastToken.createdAt.getTime()) / 60_000;

    if (diffInMinutes < RATE_LIMIT_COOLDOWN_MINUTES) {
      const waitSeconds = Math.ceil((RATE_LIMIT_COOLDOWN_MINUTES - diffInMinutes) * 60);
      throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: `tooManyRequests|${waitSeconds}` });
    }
  }

  const token = await issueVerificationToken({
    email: data.email,
    userId: user.id,
    type: 'EMAIL_VERIFICATION',
  });
  const link = `${domain.origin || env.APP_WEBSITE_URL}/auth/verify-email?token=${token}&email=${data.email}`;
  await mailer.sendVerificationEmail({
    to: data.email,
    name: user.nickName,
    link,
    locale: domain.locale,
  });

  return { success: true, message: 'verificationEmailSent' };
};

export const createInvite = async ({
  data,
  domain,
}: {
  data: InviteUserData;
  domain: Domain;
}): Promise<OutputInviteData> => {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });

  if (existingUser) throw new TRPCError({ code: 'BAD_REQUEST', message: 'userAlreadyExists' });

  await prisma.invite.deleteMany({ where: { email: data.email } });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const invite = await prisma.invite.create({
    data: { email: data.email, token, role: data.role, invitedById: data.adminId, expiresAt },
  });

  const link = `${env.APP_ADMIN_URL}/auth/sign-up?token=${token}`;
  await mailer.sendInvite({ to: invite.email, role: invite.role, link, locale: domain.locale });

  return { success: true, message: 'inviteSent' };
};
