import { GOOGLE_ANDROID_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '@/keys';
import { trpc } from '@package/api/client';
import { useAuthStore } from '@package/store/auth-native';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Toast } from 'toastify-react-native';

WebBrowser.maybeCompleteAuthSession();

console.log('Google Client IDs:', {
  ios: GOOGLE_IOS_CLIENT_ID,
  web: GOOGLE_WEB_CLIENT_ID,
  android: GOOGLE_ANDROID_CLIENT_ID,
});
export function useGoogleAuth() {
  const { login } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const loginMobileProvider = trpc.auth.loginMobileProvider.useMutation();

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'com.omni.app',
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    redirectUri: redirectUri,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.authentication?.idToken || response.params?.id_token;

      if (idToken) {
        handleBackendLogin(idToken);
      } else {
        setIsProcessing(false);
        Toast.error("Google didn't provide an ID Token");
      }
    } else if (response?.type === 'cancel' || response?.type === 'error') {
      setIsProcessing(false);
    }
  }, [response]);

  const handleBackendLogin = async (token: string) => {
    try {
      const res = await loginMobileProvider.mutateAsync({
        token: token,
        provider: 'google',
      });

      await login({
        user: res.user,
        access: res.accessToken,
        refresh: res.refreshToken || res.sessionToken,
        session: res.sessionToken,
      });

      Toast.success(`Welcome back, ${res.user.nickName}!`);
    } catch (error: any) {
      console.error('Backend Auth Error:', error);
      Toast.error('Server authentication failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const signIn = async () => {
    setIsProcessing(true);
    try {
      const result = await promptAsync();
      if (result.type !== 'success') {
        setIsProcessing(false);
      }
    } catch (e) {
      setIsProcessing(false);
      Toast.error('Failed to open login window');
    }
  };

  return {
    signIn,
    isLoading: !request || isProcessing || loginMobileProvider.isPending,
  };
}
