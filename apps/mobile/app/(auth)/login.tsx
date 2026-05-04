'use client';

import { openExternalLink } from '@/helpers/link';
import { useFacebookAuth } from '@/hooks/use-facebook-auth';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { getLocalizedError } from '@/lib/i18n/error-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from '@package/api/client';
import { AuthSchema } from '@package/api/schema';
import { useAuthStore } from '@package/store/auth-native';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { Toast } from 'toastify-react-native';

export default function Login() {
  const { t } = useTranslation();
  const te = (key: string) => t(`Common.Errors.${key}`);
  const { colorScheme } = useColorScheme();
  const { signIn: googleSignIn, isLoading: isGoogleLoading } = useGoogleAuth();
  const { signIn: facebookSignIn, isLoading: isFacebookLoading } = useFacebookAuth();
  const { login } = useAuthStore();

  const loginMutation = trpc.auth.login.useMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthSchema.SignInFormData>({
    resolver: zodResolver(AuthSchema.signInFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: AuthSchema.SignInData) => {
    try {
      const response = await loginMutation.mutateAsync({
        email: data.email,
        password: data.password,
      });

      if (response.status === 'REQUIRES_2FA') {
        router.push({
          pathname: '/(auth)/verify-2fa',
          params: { mfaToken: response.mfaToken },
        });
        return;
      }

      await login({
        user: response.user,
        access: response.accessToken,
        refresh: response.refreshToken || '',
        session: response.sessionToken,
      });

      Toast.success(`Welcome back, ${response.user.nickName || 'user'}!`);
    } catch (error: any) {
      const message = getLocalizedError(error.message, te);
      Toast.error(message || t('Common.Errors.unknown'));
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-slate-50 dark:bg-[#020617]">
      <View className="flex-1 px-6 pb-8 justify-between">
        {/* Welcome Text */}
        <View className="mt-10 mb-8">
          <Text className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
            {t('Auth.SignIn.Public.title')}
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
            {t('Auth.SignIn.Public.description')}
          </Text>
        </View>

        {/* Main Form Card */}
        <View className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-8 rounded-[3rem] shadow-sm">
          <View className="mb-2">
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t('Auth.SignIn.Form.emailLabel')}
                  mode="flat"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  error={!!errors.email}
                  contentStyle={{ backgroundColor: 'transparent' }}
                  style={{ backgroundColor: 'transparent' }}
                  activeUnderlineColor="#3b82f6"
                />
              )}
            />
            <HelperText type="error" visible={!!errors.email}>
              {getLocalizedError(errors.email?.message, te)}
            </HelperText>
          </View>

          <View className="mb-2">
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t('Auth.SignIn.Form.passwordLabel')}
                  mode="flat"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  secureTextEntry
                  error={!!errors.password}
                  contentStyle={{ backgroundColor: 'transparent' }}
                  style={{ backgroundColor: 'transparent' }}
                  activeUnderlineColor="#3b82f6"
                />
              )}
            />
            <HelperText type="error" visible={!!errors.password}>
              {getLocalizedError(errors.password?.message, te)}
            </HelperText>
          </View>

          <TouchableOpacity
            onPress={() => openExternalLink('/auth/forgot-password')}
            className="mb-8 self-end"
          >
            <Text className="text-brand-500 font-bold">{t('Auth.SignIn.Form.forgotPassword')}</Text>
          </TouchableOpacity>

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={loginMutation.isPending}
            disabled={loginMutation.isPending}
            className="bg-brand-500 py-2 rounded-2xl shadow-lg shadow-brand-500/20"
            labelStyle={{ fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5, color: 'white' }}
          >
            {t('Auth.SignIn.Form.submitButton')}
          </Button>
        </View>

        {/* Social Auth Section */}
        <View className="mt-8">
          <View className="flex-row items-center mb-8">
            <View className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
            <Text className="mx-4 text-gray-500 dark:text-gray-500 font-medium text-sm">
              {t('Auth.SignIn.Public.or')}
            </Text>
            <View className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
          </View>

          <View className="flex-col gap-4">
            <Button
              mode="outlined"
              icon={({ size, color }) => (
                <MaterialCommunityIcons name="google" size={size} color={color} />
              )}
              className="rounded-2xl py-1 border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5"
              textColor={colorScheme === 'dark' ? 'white' : '#1B254B'}
              contentStyle={{ height: 54 }}
              onPress={googleSignIn}
              loading={isGoogleLoading}
              disabled={isGoogleLoading || isFacebookLoading || loginMutation.isPending}
            >
              {t('Auth.SignIn.Public.providerBtn', { provider: 'Google' })}
            </Button>
            <Button
              mode="contained"
              icon={({ size }) => (
                <MaterialCommunityIcons name="facebook" size={size} color="white" />
              )}
              className="rounded-2xl py-1 bg-[#1877F2]"
              contentStyle={{ height: 54 }}
              onPress={facebookSignIn}
              loading={isFacebookLoading}
              disabled={isFacebookLoading || isGoogleLoading || loginMutation.isPending}
            >
              {t('Auth.SignIn.Public.providerBtn', { provider: 'Facebook' })}
            </Button>
          </View>
        </View>

        {/* Footer */}
        <View className="mt-12 items-center">
          <TouchableOpacity onPress={() => openExternalLink('/auth/sign-up')}>
            <Text className="text-gray-600 dark:text-gray-400 text-sm">
              {t('Auth.SignIn.Form.notRegistered')}{' '}
              <Text className="text-brand-500 font-bold">
                {t('Auth.SignIn.Form.createAccountLink')}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
