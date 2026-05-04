import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';

import { OutputVerifyOuthTokenData } from './auth.schema';

const googleClient = new OAuth2Client(
  process.env.GOOGLE_WEB_CLIENT_ID,
  process.env.GOOGLE_WEB_CLIENT_SECRET
);

export async function verifyGoogleMobileToken(
  tokenOrCode: string
): Promise<OutputVerifyOuthTokenData> {
  let idToken = tokenOrCode;
  console.log('Get Google token:', idToken);
  if (tokenOrCode.length < 150) {
    console.log('Trying to exchange code for token...');
    try {
      const { tokens } = await googleClient.getToken({
        code: tokenOrCode,
        redirect_uri: 'com.omni.app://',
      });
      idToken = tokens.id_token!;
    } catch (err: any) {
      console.error('GOOGLE_DETAILS:', err.response?.data);
      throw new Error('Failed to exchange code');
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
  } catch (error: any) {
    console.error('Verify ID Token Error:', error.message);
    throw new Error('Invalid Google token');
  }
}

export async function verifyFacebookMobileToken(token: string): Promise<OutputVerifyOuthTokenData> {
  try {
    const { data } = await axios.get(
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
  } catch (error: any) {
    console.error('Facebook Token Verification Error:', error.response?.data || error.message);
    throw new Error('Invalid Facebook token');
  }
}
