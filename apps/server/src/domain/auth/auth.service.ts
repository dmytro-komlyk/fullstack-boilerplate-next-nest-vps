import crypto from 'node:crypto';

import { getEmailTranslations } from '@package/i18n';
import { prisma } from '@package/prisma';
import { TRPCError } from '@trpc/server';
import { compare, hash } from 'bcryptjs';

import { sendEmail } from '../../utils/nodemailer/sendEmail';
import { Domain } from '../trpc/trpc.context';
import {
  ActiveTwoFatorData,
  CheckTokenData,
  ForgotPasswordFormData,
  ForgotPasswordOutputData,
  InputBackendTokens,
  InviteUserData,
  OutputAccessToken,
  OutputActiveTwoFatorData,
  OutputAuthData,
  OutputAuthProviderData,
  OutputCheckTokenData,
  OutputInviteData,
  OutputSetupTwoFatorData,
  OutputSignOutData,
  ResendVerificationEmailData,
  ResetPasswordData,
  ResetPasswordOutputData,
  SignInData,
  SignInProviderData,
  SignOutData,
  SignUpData,
  SignUpResponseData,
  TwoFactorData,
  UserRole,
  VerifyEmailOutputData,
} from './auth.schema';
import { generateBackendTokens, verifyToken as verifyJWTToken } from './jwt.service';
import {
  generateBackupCodes,
  generateTwoFactorSecret,
  verifyTwoFactorToken,
} from './two-factor.service';

export async function signIn({
  data,
  domain,
}: {
  data: SignInData;
  domain: Domain;
}): Promise<OutputAuthData> {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: { accounts: true },
  });

  if (!user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'invalidCredentials',
      cause: 'User not found',
    });
  }

  if (user.status === 'BANNED') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'accountBanned',
    });
  }

  const isAdminHost = domain.origin?.includes('admin');
  const isAdminRole = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

  if (isAdminHost && !isAdminRole) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'adminOnly',
    });
  }

  if (!isAdminHost && isAdminRole) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'mustLoginAsAdmin',
    });
  }

  if (!user.password) {
    const providerNames = user.accounts
      .map(({ provider }: { provider: string }) => {
        return provider.charAt(0).toUpperCase() + provider.slice(1);
      })
      .join(', ');

    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `socialAccountFound|${providerNames}`,
    });
  }

  if (!user.emailVerified) {
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: data.email,
        type: 'EMAIL_VERIFICATION',
      },
    });

    const token = crypto.randomUUID();

    await prisma.verificationToken.create({
      data: {
        identifier: data.email,
        token,
        type: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
        userId: user.id,
      },
    });

    const t = await getEmailTranslations(domain.locale, 'verify');

    const link = `${domain.origin || process.env.APP_WEBSITE_URL}/auth/verify-email?token=${token}`;

    await sendEmail({
      email: data.email,
      payload: {
        link,
        name: user.nickName,
        appName: process.env.APP_NAME as string,
        t,
        lang: domain.locale,
      },
      template: '/templates/verifyEmail.handlebars',
      subject: t.subject,
    });

    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'emailNotVerified',
    });
  }

  const isPasswordValid = await compare(data.password, user.password);

  if (!isPasswordValid) {
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingMinutes = Math.ceil(remainingMs / 1000 / 60);

      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `accountRemaining|${remainingMinutes}`,
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: { increment: 1 },
      },
      select: {
        failedLoginAttempts: true,
      },
    });

    const attempts = updatedUser.failedLoginAttempts;

    if (attempts >= 5) {
      const minutes = Math.min(15 * Math.pow(2, attempts - 5), 1440);
      const lockedUntil = new Date(Date.now() + minutes * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: { lockedUntil },
      });

      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `accountSuspended|${minutes}`,
      });
    }

    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: `incorrectPasswordAttempts|${5 - updatedUser.failedLoginAttempts}`,
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastActiveAt: new Date(),
      isOnline: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  if (user.isTwoFactorEnabled) {
    const { accessToken: mfaToken } = await generateBackendTokens(
      {
        sub: user.id,
        email: user.email as string,
        type: '2FA_PENDING',
      },
      {
        updateAccess: true,
        updateRefresh: false,
        clientId: domain.clientId ?? 'unknown',
      }
    );

    return {
      status: 'REQUIRES_2FA',
      mfaToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        nickName: user.nickName,
        avatarUrl: user.avatarUrl,
        forcePasswordChange: user.forcePasswordChange,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
      },
    };
  }

  const isWeb = !!domain.origin;

  const { accessToken, refreshToken, accessTokenExp, refreshTokenExp } =
    await generateBackendTokens(
      {
        sub: user.id,
        email: user.email as string,
      },
      {
        updateAccess: true,
        updateRefresh: true,
        clientId: domain.clientId ?? 'unknown',
        userAgent: domain.userAgent ?? undefined,
      }
    );

  const sessionToken = isWeb ? crypto.randomUUID() : refreshToken;
  const sessionExpires = isWeb ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : refreshTokenExp;

  await prisma.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expiresAt: sessionExpires,
      clientId: domain.clientId,
      userAgent: domain.userAgent,
    },
  });

  return {
    status: 'SUCCESS',
    accessToken,
    refreshToken,
    accessTokenExp,
    refreshTokenExp,
    sessionToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      nickName: user.nickName,
      avatarUrl: user.avatarUrl,
      forcePasswordChange: user.forcePasswordChange,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    },
  };
}

export async function setup2FALogin({
  user,
}: {
  user: TwoFactorData;
  domain: Domain;
}): Promise<OutputSetupTwoFatorData> {
  const currentUser = await prisma.user.findUnique({ where: { id: user.id } });

  if (currentUser?.isTwoFactorEnabled) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'twoFactorAlreadyEnabled',
    });
  }

  const { secret, qrCodeUrl } = await generateTwoFactorSecret(user.email);

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: secret, isTwoFactorEnabled: false },
  });

  return { secret, qrCodeUrl };
}

export async function verify2FALogin({
  data,
  domain,
}: {
  data: { mfaToken: string; code: string };
  domain: Domain;
}): Promise<OutputAuthData> {
  const payload = await verifyJWTToken({ type: '2fa', token: data.mfaToken });

  if (!payload.sub) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'twoFactorVerifyToken',
    });
  }

  if (payload.type !== '2FA_PENDING') {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'twoFactorInvalidToken' });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  });

  if (!user || !user.twoFactorSecret) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'twoFactorNotConfigured' });
  }

  const isValid = await verifyTwoFactorToken(data.code, user.twoFactorSecret);

  if (!isValid) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'twoFactorInvalidCode' });
  }

  const isWeb = !!domain.origin;
  const { accessToken, refreshToken, accessTokenExp, refreshTokenExp } =
    await generateBackendTokens(
      { sub: user.id, email: user.email as string },
      {
        updateAccess: true,
        updateRefresh: true,
        clientId: domain.clientId ?? 'unknown',
        userAgent: domain.userAgent ?? undefined,
      }
    );

  const sessionToken = isWeb ? crypto.randomUUID() : refreshToken;
  const sessionExpires = isWeb ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : refreshTokenExp;

  await prisma.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expiresAt: sessionExpires,
      isTwoFactorVerified: true,
      clientId: domain.clientId,
      userAgent: domain.userAgent,
    },
  });

  return {
    status: 'SUCCESS',
    accessToken,
    refreshToken,
    accessTokenExp,
    refreshTokenExp,
    sessionToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      nickName: user.nickName,
      avatarUrl: user.avatarUrl,
      forcePasswordChange: user.forcePasswordChange,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    },
  };
}

export async function activate2FA({
  data,
}: {
  data: ActiveTwoFatorData & { userId: string };
  domain: Domain;
}): Promise<OutputActiveTwoFatorData> {
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    select: {
      id: true,
      twoFactorSecret: true,
      isTwoFactorEnabled: true,
    },
  });

  if (!user || !user.twoFactorSecret) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'twoFactorSecretNotFound',
    });
  }

  const isValid = await verifyTwoFactorToken(data.code, user.twoFactorSecret);

  if (!isValid) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'twoFactorInvalidVerificationCode',
    });
  }

  const { plain, hashed } = await generateBackupCodes();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isTwoFactorEnabled: true,
      twoFactorBackupCodes: hashed,
    },
  });

  await prisma.session.updateMany({
    where: {
      userId: user.id,
    },
    data: {
      isTwoFactorVerified: true,
    },
  });

  return {
    success: true,
    backupCodes: plain,
  };
}

export async function verifyEmail(input: { token: string; email: string }) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'userNotFound',
    });
  }

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
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'invalidVerificationToken',
    });
  }

  await prisma.user.update({
    where: { id: verificationToken.user.id },
    data: { emailVerified: new Date(), status: 'ACTIVE' },
  });

  await prisma.verificationToken.deleteMany({
    where: {
      token: input.token,
      identifier: input.email,
      type: 'EMAIL_VERIFICATION',
    },
  });

  return {
    success: true,
    message: 'emailVerified',
    userId: verificationToken.user.id,
  };
}

export async function verifyToken(input: CheckTokenData): Promise<OutputCheckTokenData> {
  const tokenRecord = await prisma.verificationToken.findFirst({
    where: { token: input.token },
    include: { user: true },
  });

  if (!tokenRecord || !tokenRecord.user) {
    return {
      success: false,
      message: 'invalidResetLink',
    };
  }

  if (tokenRecord.expiresAt < new Date()) {
    return {
      success: false,
      email: tokenRecord.user.email as string,
      message: 'invalidResetLink',
    };
  }

  return {
    success: true,
    email: tokenRecord.user.email as string,
    message: 'validToken',
  };
}

export async function resendVerification({
  data,
  domain,
}: {
  data: ResendVerificationEmailData;
  domain: Domain;
}): Promise<VerifyEmailOutputData> {
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

  if (user && isAdminHost && user.role === 'USER') {
    return { success: true, message: 'verificationEmailSent' };
  }

  if (!user) {
    return { success: true, message: 'verificationEmailSent' };
  }

  if (user.emailVerified) {
    return { success: false, message: 'emailAlreadyVerified' };
  }

  const lastToken = user.verificationTokens?.[0];

  if (lastToken) {
    const cooldownInMinutes = 2;
    const now = new Date();
    const diffInMs = now.getTime() - lastToken.createdAt.getTime();
    const diffInMinutes = diffInMs / (1000 * 60);

    if (diffInMinutes < cooldownInMinutes) {
      console.warn(`[RateLimit] Verification reset attempt too frequent for: ${data.email}`);
      const waitSeconds = Math.ceil((cooldownInMinutes - diffInMinutes) * 60);
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `tooManyRequests|${waitSeconds}`,
      });
    }
  }

  const token = crypto.randomUUID();

  await prisma.verificationToken.deleteMany({
    where: {
      identifier: data.email,
      type: 'EMAIL_VERIFICATION',
    },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: data.email,
      token,
      type: 'EMAIL_VERIFICATION',
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      userId: user.id,
    },
  });

  const t = await getEmailTranslations(domain.locale, 'verify');

  const link = `${domain.origin || process.env.APP_WEBSITE_URL}/auth/verify-email?token=${token}`;

  await sendEmail({
    email: data.email,
    payload: {
      link,
      name: user.nickName,
      appName: process.env.APP_NAME as string,
      t,
      lang: domain.locale,
    },
    template: '/templates/verifyEmail.handlebars',
    subject: t.subject,
  });

  return {
    success: true,
    message: 'verificationEmailSent',
  };
}

export async function signInProvider({
  data,
  domain,
}: {
  data: SignInProviderData;
  domain: Domain;
}): Promise<OutputAuthProviderData> {
  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: data.provider,
        providerAccountId: data.providerAccountId,
      },
    },
    include: { user: true },
  });

  let user = existingAccount?.user || null;

  if (!user && data.email) {
    user = await prisma.user.findUnique({ where: { email: data.email } });
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        nickName: data.nickName,
        emailVerified: new Date(),
      },
    });
  }

  if (!existingAccount) {
    await prisma.account.create({
      data: {
        userId: user.id,
        type: 'oauth',
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        avatarUrl: data.avatarUrl,
      },
    });
  } else {
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: { avatarUrl: data.avatarUrl },
    });
  }

  user = await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: user.firstName ?? data.firstName,
      lastName: user.lastName ?? data.lastName,
      lastActiveAt: new Date(),
      isOnline: true,
    },
  });

  const isWeb = !!domain.origin;
  const finalClientId = data.clientId || domain.clientId || 'unknown';

  const { accessToken, refreshToken, accessTokenExp, refreshTokenExp } =
    await generateBackendTokens(
      {
        sub: user.id,
        email: user.email || '',
      },
      {
        updateAccess: true,
        updateRefresh: true,
        clientId: finalClientId,
        userAgent: domain.userAgent ?? undefined,
      }
    );

  const sessionToken = isWeb ? crypto.randomUUID() : refreshToken;
  const sessionExpires = isWeb ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : refreshTokenExp;

  await prisma.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expiresAt: sessionExpires,
      clientId: finalClientId,
      userAgent: domain.userAgent,
    },
  });

  return {
    status: 'SUCCESS',
    accessToken,
    refreshToken,
    accessTokenExp,
    refreshTokenExp,
    sessionToken,
    user: {
      id: user.id,
      role: user.role,
      email: user.email,
      nickName: user.nickName,
      avatarUrl: user.avatarUrl || data.avatarUrl,
      forcePasswordChange: user.forcePasswordChange,
    },
  };
}

export async function signUp({
  domain,
  data,
}: {
  domain: Domain;
  data: SignUpData & { inviteToken?: string };
}): Promise<SignUpResponseData> {
  const isAdminHost = domain.origin?.includes('admin');
  let assignedRole: UserRole = 'USER';

  if (isAdminHost) {
    if (!data.inviteToken) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'requireInvitation',
      });
    }

    const invite = await prisma.invite.findUnique({
      where: {
        token: data.inviteToken,
        email: data.email,
        isAccepted: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!invite) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'invalidInvitation',
      });
    }

    assignedRole = invite.role;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    if (existingUser.emailVerified) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'userAlreadyExists',
      });
    }

    await prisma.verificationToken.deleteMany({
      where: {
        identifier: data.email,
        type: 'EMAIL_VERIFICATION',
      },
    });

    const token = crypto.randomUUID();

    await prisma.verificationToken.create({
      data: {
        identifier: data.email,
        token,
        type: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
        userId: existingUser.id,
      },
    });
    const t = await getEmailTranslations(domain.locale, 'verify');

    const link = `${domain.origin || process.env.APP_WEBSITE_URL}/auth/verify-email?token=${token}`;

    await sendEmail({
      email: data.email,
      payload: {
        link,
        name: existingUser.nickName,
        appName: process.env.APP_NAME as string,
        t,
        lang: domain.locale,
      },
      template: '/templates/verifyEmail.handlebars',
      subject: t.subject,
    });

    return {
      success: true,
      message: 'verificationEmailSent',
      userId: existingUser.id,
    };
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
    },
  });

  const token = crypto.randomUUID();

  await prisma.verificationToken.create({
    data: {
      identifier: data.email,
      token: token,
      type: 'EMAIL_VERIFICATION',
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
      userId: user.id,
    },
  });

  const t = await getEmailTranslations(domain.locale, 'verify');

  const link = `${domain.origin || process.env.APP_WEBSITE_URL}/auth/verify-email?token=${token}`;

  await sendEmail({
    email: data.email,
    payload: {
      link,
      name: user.nickName,
      appName: process.env.APP_NAME as string,
      t,
      lang: domain.locale,
    },
    template: '/templates/verifyEmail.handlebars',
    subject: t.subject,
  });

  return {
    success: true,
    message: 'registrationUser',
    userId: user.id,
  };
}

export async function signOut({
  userId,
  clientId,
  sessionToken,
}: SignOutData): Promise<OutputSignOutData> {
  if (sessionToken) {
    await prisma.session.deleteMany({
      where: { sessionToken },
    });
  }

  if (clientId) {
    await prisma.token.deleteMany({
      where: {
        userId,
        clientId,
        type: {
          in: ['ACCESS', 'REFRESH'],
        },
      },
    });
  }

  const activeSessionsCount = await prisma.session.count({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      isOnline: activeSessionsCount > 0,
      lastActiveAt: new Date(),
    },
  });

  return {
    userId,
    success: true,
    message: 'logoutSuccess',
    isLogined: false,
  };
}

export async function receivePasswordResetLink({
  data,
  domain,
  logger,
}: {
  data: ForgotPasswordFormData;
  domain: Domain;
  logger?: any;
}): Promise<ForgotPasswordOutputData> {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: {
      verificationTokens: {
        where: { type: 'PASSWORD_RESET' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'invalidEmail',
      cause: 'User not found',
    });
  }

  const isAdminHost = domain.origin?.includes('admin');
  const isAdminRole = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

  const SUCCESS_MESSAGE = 'recoveryEmailSent';

  if (!user) {
    return {
      success: true,
      message: SUCCESS_MESSAGE,
    };
  }

  if (user && isAdminRole && !isAdminHost) {
    logger.warn(`[Security] Admin ${user.email} tried to reset password via public website.`);
    return { success: true, message: SUCCESS_MESSAGE };
  }

  if (user && !isAdminRole && isAdminHost) {
    logger.warn(`[Security] User ${user.email} tried to reset password via admin panel.`);
    return { success: true, message: SUCCESS_MESSAGE };
  }

  const lastToken = user.verificationTokens?.[0];

  if (lastToken) {
    const cooldownInMinutes = 2;
    const now = new Date();
    const diffInMs = now.getTime() - lastToken.createdAt.getTime();
    const diffInMinutes = diffInMs / (1000 * 60);

    if (diffInMinutes < cooldownInMinutes) {
      logger.warn(`[RateLimit] Password reset attempt too frequent for: ${data.email}`);
      const waitSeconds = Math.ceil((cooldownInMinutes - diffInMinutes) * 60);
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `tooManyRequests|${waitSeconds}`,
      });
    }
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);

  await prisma.verificationToken.deleteMany({
    where: {
      identifier: data.email,
      type: 'PASSWORD_RESET',
    },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: data.email,
      token,
      type: 'PASSWORD_RESET',
      expiresAt,
      userId: user.id,
    },
  });

  const t = await getEmailTranslations(domain.locale, 'resetPassword');

  const link = `${domain.origin || process.env.APP_WEBSITE_URL}/auth/reset-password?token=${token}`;

  await sendEmail({
    email: data.email,
    payload: {
      link,
      name: user.nickName,
      appName: process.env.APP_NAME as string,
      t,
      lang: domain.locale,
    },
    template: '/templates/forgotPasswordEmail.handlebars',
    subject: t.subject,
  });

  return {
    success: true,
    message: SUCCESS_MESSAGE,
  };
}

export async function resetPassword({
  data,
  domain,
}: {
  data: ResetPasswordData;
  domain: Domain;
}): Promise<ResetPasswordOutputData> {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: {
      verificationTokens: {
        where: {
          token: data.token,
          type: 'PASSWORD_RESET',
        },
      },
    },
  });

  const isAdminHost = domain.origin?.includes('admin');

  if (user && isAdminHost && user.role === 'USER') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'accessDenied',
    });
  }

  const tokenRecord = user?.verificationTokens[0];

  if (!user || !tokenRecord || tokenRecord.expiresAt < new Date()) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'invalidResetLink',
    });
  }

  const hashedPassword = await hash(data.password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  await prisma.verificationToken.deleteMany({
    where: {
      identifier: data.email,
      type: 'PASSWORD_RESET',
    },
  });

  const emailTranslations = await getEmailTranslations(domain.locale, 'passwordChanged');
  const appName = process.env.APP_NAME as string;

  const t = {
    ...emailTranslations,
    description: emailTranslations.description.replace('{{appName}}', appName),
  };

  const loginLink = `${domain.origin}/auth/sign-in`;

  await sendEmail({
    email: data.email,
    payload: {
      link: loginLink,
      name: user.nickName || user.firstName,
      appName,
      t,
      lang: domain.locale,
    },
    template: '/templates/passwordUpdatedConfirmation.handlebars',
    subject: t.subject,
  });

  return {
    success: true,
    message: 'passwordUpdated',
  };
}

export async function changeForcedPassword({
  data,
  domain,
}: {
  data: any;
  domain: Domain;
}): Promise<ResetPasswordOutputData> {
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
  });

  if (!user) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'userSessionNotFound',
    });
  }

  const isAdminHost = domain.origin?.includes('admin');

  if (isAdminHost && user.role === 'USER') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'accessDenied',
    });
  }

  const hashedPassword = await hash(data.password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      forcePasswordChange: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  await prisma.verificationToken.deleteMany({
    where: {
      identifier: user.email!,
      type: 'PASSWORD_RESET',
    },
  });

  const emailTranslations = await getEmailTranslations(domain.locale, 'passwordChanged');
  const appName = process.env.APP_NAME as string;

  const t = {
    ...emailTranslations,
    description: emailTranslations.description.replace('{{appName}}', appName),
  };

  const loginLink = `${domain.origin}/auth/sign-in`;

  await sendEmail({
    email: user.email!,
    payload: {
      link: loginLink,
      name: user.nickName || user.firstName || 'Admin',
      appName,
      t,
      lang: domain.locale,
    },
    template: '/templates/passwordUpdatedConfirmation.handlebars',
    subject: t.subject,
  });

  return {
    success: true,
    message: 'securityProtocolInitialized',
  };
}

export async function updateAccessBackendToken({
  payload,
  domain,
}: {
  payload: InputBackendTokens;
  domain: Domain;
}): Promise<OutputAccessToken> {
  const { accessToken, accessTokenExp } = await generateBackendTokens(payload, {
    updateAccess: true,
    updateRefresh: false,
    clientId: domain.clientId ?? 'unknown',
    userAgent: domain.userAgent ?? undefined,
  });

  return {
    accessToken: accessToken,
    accessTokenExp: accessTokenExp,
  };
}

export async function createInvite({
  data,
  domain,
}: {
  data: InviteUserData;
  domain: Domain;
}): Promise<OutputInviteData> {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });

  if (existingUser) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'userAlreadyExists',
    });
  }

  await prisma.invite.deleteMany({
    where: { email: data.email },
  });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

  const invite = await prisma.invite.create({
    data: {
      email: data.email,
      token,
      role: data.role,
      invitedById: data.adminId,
      expiresAt,
    },
  });

  const t = await getEmailTranslations(domain.locale, 'verify'); // invite email can use same translations as verify email for now, can be changed later if needed

  const link = `${process.env.APP_ADMIN_URL}/auth/sign-up?token=${token}`;

  const subject = t.subject.includes('{{appName}}')
    ? t.subject.replace('{{appName}}', process.env.APP_NAME)
    : t.subject;

  await sendEmail({
    email: invite.email,
    payload: {
      link,
      role: invite.role,
      appName: process.env.APP_NAME as string,
      t,
      lang: domain.locale,
    },
    template: '/templates/inviteEmail.handlebars',
    subject: subject,
  });

  return {
    success: true,
    message: 'inviteSent',
  };
}
