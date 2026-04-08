import { procedure, protectedProcedure, router } from '../trpc/trpc.server';
import {
  activeTwoFatorSchema,
  changeForcedPasswordSchema,
  checkTokenSchema,
  ForgotPasswordOutputData,
  forgotPasswordOutputSchema,
  forgotPasswordSchema,
  inputBackendTokensSchema,
  inviteUserSchema,
  OutputAccessToken,
  outputAccessTokenSchema,
  OutputActiveTwoFatorData,
  outputActiveTwoFatorSchema,
  OutputAuthData,
  outputAuthProviderSchema,
  outputAuthSchema,
  OutputChangeForcedPasswordData,
  outputChangeForcedPasswordSchema,
  OutputCheckTokenData,
  outputCheckTokenSchema,
  outputInviteSchema,
  OutputSetupTwoFatorData,
  outputSetupTwoFatorSchema,
  OutputSignOutData,
  outputSignOutSchema,
  OutputVerifyOuthTokenData,
  resendVerificationEmailSchema,
  ResetPasswordOutputData,
  resetPasswordOutputSchema,
  resetPasswordSchema,
  signInMobileProviderSchema,
  signInProviderSchema,
  signInSchema,
  SignUpResponseData,
  signUpResponseSchema,
  signUpSchema,
  VerifyEmailOutputData,
  verifyEmailOutputSchema,
  verifyEmailSchema,
  verifyTwoFatorSchema,
} from './auth.schema';
import {
  activate2FA,
  changeForcedPassword,
  createInvite,
  receivePasswordResetLink,
  resendVerification,
  resetPassword,
  setup2FALogin,
  signIn,
  signInProvider,
  signOut,
  signUp,
  updateAccessBackendToken,
  verify2FALogin,
  verifyEmail,
  verifyToken,
} from './auth.service';
import { verifyFacebookMobileToken, verifyGoogleMobileToken } from './oauth.service';

export const authRouter = router({
  login: procedure
    .meta({
      openapi: {
        enabled: true,
        method: 'POST',
        path: '/auth.login',
        summary: 'Login the user',
        tags: ['auth'],
        protect: false,
      },
    })
    .input(signInSchema)
    .output(outputAuthSchema)
    .mutation(async ({ input, ctx }) => {
      const response: OutputAuthData = await signIn({ data: input, domain: ctx.domain });
      ctx.logger.log({ email: response.user.email, path: 'auth.login' }, 'Login successfully');
      return response;
    }),
  loginProvider: procedure
    .input(signInProviderSchema)
    .output(outputAuthProviderSchema)
    .mutation(async ({ input, ctx }) => {
      const response = await signInProvider({ data: input, domain: ctx.domain });
      ctx.logger.log(
        { userId: response.user.id, path: 'auth.loginProvider' },
        'Login provider successfully'
      );
      return response;
    }),
  loginMobileProvider: procedure
    .input(signInMobileProviderSchema)
    .output(outputAuthProviderSchema)
    .mutation(async ({ input, ctx }) => {
      let oauthData: OutputVerifyOuthTokenData;

      if (input.provider === 'google') {
        oauthData = await verifyGoogleMobileToken(input.token);
      } else if (input.provider === 'facebook') {
        oauthData = await verifyFacebookMobileToken(input.token);
      } else {
        throw new Error('Unsupported provider');
      }

      const response = await signInProvider({
        data: {
          ...oauthData,
          provider: input.provider,
        },
        domain: ctx.domain,
      });

      ctx.logger.log(
        { userId: response.user.id, path: 'auth.loginMobileProvider' },
        'Login mobile provider successfully'
      );
      return response;
    }),
  logout: protectedProcedure
    .meta({
      openapi: {
        enabled: true,
        method: 'POST',
        path: '/auth.logout',
        summary: 'Logout the user',
        tags: ['auth'],
        protect: true,
      },
    })
    .output(outputSignOutSchema)
    .mutation(async ({ ctx }) => {
      const response: OutputSignOutData = await signOut({
        userId: ctx.user.id,
        clientId: ctx.domain.clientId,
        sessionToken: ctx.sessionToken,
      });
      ctx.logger.log({ userId: response.userId, path: 'auth.logout' }, response.message);
      return response;
    }),
  register: procedure
    .meta({
      openapi: {
        enabled: true,
        method: 'POST',
        path: '/auth.register',
        summary: 'Register a new user',
        tags: ['auth'],
        protect: false,
      },
    })
    .input(signUpSchema)
    .output(signUpResponseSchema)
    .mutation(async ({ input, ctx }) => {
      const response: SignUpResponseData = await signUp({ data: input, domain: ctx.domain });
      ctx.logger.log({ userId: response.userId, path: 'auth.register' }, response.message);
      return response;
    }),
  checkToken: procedure
    .meta({
      openapi: {
        enabled: true,
        method: 'GET',
        path: '/auth.checkToken',
        summary: 'Checking the auth token',
        tags: ['auth'],
        protect: true,
      },
    })
    .input(checkTokenSchema)
    .output(outputCheckTokenSchema)
    .query(async ({ input, ctx }) => {
      const response: OutputCheckTokenData = await verifyToken({
        token: input.token,
      });
      ctx.logger.log({ input, path: 'auth.checkToken' }, 'Check token successfully');
      return response;
    }),
  refresh: protectedProcedure
    .meta({
      openapi: {
        enabled: true,
        method: 'POST',
        path: '/auth.refresh',
        summary: 'Update access backend token',
        tags: ['auth'],
        protect: true,
      },
    })
    .input(inputBackendTokensSchema)
    .output(outputAccessTokenSchema)
    .mutation(async ({ input, ctx }) => {
      const response: OutputAccessToken = await updateAccessBackendToken({
        payload: input,
        domain: ctx.domain,
      });
      ctx.logger.log({ input, path: 'auth.refresh' }, 'Refresh access token successfully');
      return response;
    }),
  verifyEmail: procedure
    .meta({
      openapi: {
        enabled: true,
        method: 'POST',
        path: '/auth.verifyEmail',
        summary: 'Verify the email of a user using the token from email',
        tags: ['auth'],
        protect: false,
      },
    })
    .input(verifyEmailSchema)
    .output(verifyEmailOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const response: VerifyEmailOutputData = await verifyEmail(input);
      ctx.logger.log(
        { email: input.email, path: 'auth.verifyEmail' },
        'Email verified successfully'
      );
      return response;
    }),
  resendVerification: procedure
    .meta({
      openapi: {
        enabled: true,
        method: 'POST',
        path: '/auth.resendVerification',
        summary: 'Resend the verification email',
        tags: ['auth'],
        protect: false,
      },
    })
    .input(resendVerificationEmailSchema)
    .output(verifyEmailOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const response: VerifyEmailOutputData = await resendVerification({
        data: input,
        domain: ctx.domain,
      });
      ctx.logger.log({ email: input.email, path: 'auth.resendVerification' }, response.message);
      return response;
    }),
  forgotPassword: procedure
    .meta({
      openapi: {
        enabled: true,
        method: 'POST',
        path: '/auth.forgotPassword',
        summary: 'Receive a password reset link',
        tags: ['auth'],
        protect: false,
      },
    })
    .input(forgotPasswordSchema)
    .output(forgotPasswordOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const response: ForgotPasswordOutputData = await receivePasswordResetLink({
        data: input,
        domain: ctx.domain,
        logger: ctx.logger,
      });
      ctx.logger.log({ email: input.email, path: 'auth.forgotPassword' }, response.message);
      return response;
    }),
  resetPassword: procedure
    .meta({
      openapi: {
        enabled: true,
        method: 'POST',
        path: '/auth.resetPassword',
        summary: 'Update user password',
        tags: ['auth'],
        protect: false,
      },
    })
    .input(resetPasswordSchema)
    .output(resetPasswordOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const response: ResetPasswordOutputData = await resetPassword({
        data: input,
        domain: ctx.domain,
      });
      ctx.logger.log({ email: input.email, path: 'auth.resetPassword' }, response.message);
      return response;
    }),
  changeForcedPassword: protectedProcedure
    .meta({
      openapi: {
        enabled: true,
        method: 'POST',
        path: '/auth.changeForcedPassword',
        summary: 'Change force user password',
        tags: ['auth'],
        protect: true,
      },
    })
    .input(changeForcedPasswordSchema)
    .output(outputChangeForcedPasswordSchema)
    .mutation(async ({ input, ctx }) => {
      const response: OutputChangeForcedPasswordData = await changeForcedPassword({
        data: {
          password: input.password,
          userId: ctx.user.id,
        },
        domain: ctx.domain,
      });
      ctx.logger.log(
        { email: ctx.user.email, path: 'auth.changeForcedPassword' },
        response.message
      );
      return response;
    }),
  inviteUser: protectedProcedure
    .meta({
      openapi: {
        enabled: true,
        method: 'POST',
        path: '/auth.inviteUser',
        summary: 'Invite a new user',
        tags: ['auth'],
        protect: true,
      },
    })
    .input(inviteUserSchema)
    .output(outputInviteSchema)
    .mutation(async ({ input, ctx }) => {
      const response: ResetPasswordOutputData = await createInvite({
        data: input,
        domain: ctx.domain,
      });
      ctx.logger.log({ email: input.email, path: 'auth.inviteUser' }, response.message);
      return response;
    }),
  setup2FA: protectedProcedure
    .meta({
      openapi: {
        enabled: true,
        method: 'GET',
        path: '/auth.setup2FA',
        summary: 'Setup two-factor',
        tags: ['auth'],
        protect: true,
      },
    })
    .output(outputSetupTwoFatorSchema)
    .query(async ({ ctx }) => {
      const response: OutputSetupTwoFatorData = await setup2FALogin({
        user: {
          id: ctx.user.id,
          email: ctx.user.email as string,
        },
        domain: ctx.domain,
      });
      ctx.logger.log(
        { email: ctx.user.email, path: 'auth.setup2FA' },
        'Two-factor setup successful'
      );
      return response;
    }),
  verify2FA: procedure
    .meta({
      openapi: {
        enabled: true,
        method: 'POST',
        path: '/auth.verify2FA',
        summary: 'Verify two-factor code',
        tags: ['auth'],
        protect: false,
      },
    })
    .input(verifyTwoFatorSchema)
    .output(outputAuthSchema)
    .mutation(async ({ input, ctx }) => {
      const response: OutputAuthData = await verify2FALogin({
        data: {
          code: input.code,
          mfaToken: input.mfaToken,
        },
        domain: ctx.domain,
      });

      ctx.logger.log(
        {
          email: response.user.email,
          path: 'auth.verify2FA',
          status: response.status,
        },
        'Two-factor verification successful'
      );

      return response;
    }),
  activate2FA: protectedProcedure
    .meta({
      openapi: {
        enabled: true,
        method: 'POST',
        path: '/auth.activate2FA',
        summary: 'Activated two-factor',
        tags: ['auth'],
        protect: true,
      },
    })
    .input(activeTwoFatorSchema)
    .output(outputActiveTwoFatorSchema)
    .mutation(async ({ input, ctx }) => {
      const response: OutputActiveTwoFatorData = await activate2FA({
        data: {
          userId: ctx.user.id,
          code: input.code,
        },
        domain: ctx.domain,
      });

      ctx.logger.log(
        {
          email: ctx.user.email,
          path: 'auth.activate2FA',
          status: response.success,
        },
        'Two-factor activate successful'
      );

      return response;
    }),
});
