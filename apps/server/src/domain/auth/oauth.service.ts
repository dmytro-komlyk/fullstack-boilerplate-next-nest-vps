import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';

import { OutputVerifyOAuthTokenData } from './auth.schema';

const googleClient = new OAuth2Client(
  process.env.GOOGLE_WEB_CLIENT_ID,
  process.env.GOOGLE_WEB_CLIENT_SECRET
);

export async function verifyGoogleMobileToken(
  tokenOrCode: string
): Promise<OutputVerifyOAuthTokenData> {
  let idToken = tokenOrCode;

  if (tokenOrCode.length < 150) {
    try {
      const { tokens } = await googleClient.getToken({
        code: tokenOrCode,
        redirect_uri: 'com.omni.app://',
      });
      idToken = tokens.id_token!;
    } catch (err: unknown) {
      const responseData = (err as { response?: { data?: unknown } })?.response?.data;
      throw new Error(`Failed to exchange Google code: ${JSON.stringify(responseData)}`);
    }
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: [
        process.env.GOOGLE_IOS_CLIENT_ID as string,
        process.env.GOOGLE_ANDROID_CLIENT_ID as string,
        process.env.GOOGLE_WEB_CLIENT_ID as string,
      ],
    });

    const payload = ticket.getPayload();
    if (!payload) throw new Error('Invalid Google payload');

    return {
      email: payload.email || null,
      providerAccountId: payload.sub,
      firstName: payload.given_name || null,
      lastName: payload.family_name || null,
      avatarUrl: payload.picture || null,
      nickName: payload.name || payload.email?.split('@')[0] || null,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Invalid Google token: ${message}`);
  }
}

export async function verifyFacebookMobileToken(
  token: string
): Promise<OutputVerifyOAuthTokenData> {
  try {
    const { data } = await axios.get<{
      id: string;
      email?: string;
      first_name?: string;
      last_name?: string;
      name?: string;
      picture?: { data?: { url?: string } };
    }>(
      `https://graph.facebook.com/me?fields=id,email,first_name,last_name,name,picture&access_token=${token}`
    );

    if (!data.id) throw new Error('Invalid Facebook response');

    return {
      email: data.email || null,
      providerAccountId: data.id,
      firstName: data.first_name || null,
      lastName: data.last_name || null,
      avatarUrl: data.picture?.data?.url || null,
      nickName: data.name || data.first_name || null,
    };
  } catch (error: unknown) {
    const axiosData = (error as { response?: { data?: unknown } })?.response?.data;
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Invalid Facebook token: ${axiosData ? JSON.stringify(axiosData) : message}`);
  }
}
