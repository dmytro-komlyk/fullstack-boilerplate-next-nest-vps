'use client';

import { getLocalizedError } from '@/lib/i18n/error-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { trpc } from '@package/api/client';
import { useAuthStore } from '@package/store/auth-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { Toast } from 'toastify-react-native';

export default function Verify2FA() {
  const { t } = useTranslation();
  const te = (key: string) => t(`Common.Errors.${key}`);
  const { mfaToken } = useLocalSearchParams<{ mfaToken: string }>();
  const { login } = useAuthStore();

  const verifyMutation = trpc.auth.verify2FA.useMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<{ code: string }>({
    defaultValues: {
      code: '',
    },
  });

  const onSubmit = async (data: { code: string }) => {
    if (!mfaToken) {
      Toast.error(t('Common.Errors.missingToken'));
      return;
    }

    try {
      const response = await verifyMutation.mutateAsync({
        code: data.code,
        mfaToken: mfaToken,
      });

      if ('accessToken' in response) {
        await login({
          user: response.user,
          access: response.accessToken,
          refresh: response.refreshToken || '',
          session: response.sessionToken,
        });

        Toast.success(t('Auth.Verify2FA.Success.title'));
        router.replace('/(tabs)');
      } else {
        Toast.error(t('Common.Errors.unknown'));
      }
    } catch (error: any) {
      const message = getLocalizedError(error.message, te);
      Toast.error(message || t('Common.Errors.unknown'));
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-slate-50 dark:bg-[#020617]">
      <View className="flex-1 px-6 pb-8 justify-center">
        {/* Header */}
        <View className="mb-8 items-center">
          <View className="bg-brand-500/10 p-4 rounded-full mb-4">
            <MaterialCommunityIcons name="shield-lock-outline" size={48} color="#3b82f6" />
          </View>
          <Text className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter text-center">
            {t('Auth.Verify2FA.title')}
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 mt-2 text-center text-lg">
            {t('Auth.Verify2FA.description')}
          </Text>
        </View>

        {/* Form Card */}
        <View className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-8 rounded-[3rem] shadow-sm">
          <View className="mb-6">
            <Controller
              control={control}
              name="code"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t('Auth.Verify2FA.Form.codeLabel')}
                  placeholder="000000"
                  mode="flat"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="number-pad"
                  autoFocus
                  maxLength={6}
                  error={!!errors.code}
                  contentStyle={{
                    backgroundColor: 'transparent',
                    textAlign: 'center',
                    fontSize: 24,
                    fontWeight: 'bold',
                  }}
                  style={{ backgroundColor: 'transparent' }}
                  activeUnderlineColor="#3b82f6"
                />
              )}
            />
            <HelperText type="error" visible={!!errors.code}>
              {errors.code?.message}
            </HelperText>
          </View>

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={verifyMutation.isPending}
            disabled={verifyMutation.isPending || verifyMutation.isSuccess}
            className="bg-brand-500 py-2 rounded-2xl shadow-lg"
            labelStyle={{ fontWeight: 'bold', fontSize: 16, color: 'white' }}
          >
            {t('Auth.Verify2FA.Form.submitButton')}
          </Button>

          <Button mode="text" onPress={() => router.back()} className="mt-4" textColor="#64748b">
            {t('Common.cancel')}
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
