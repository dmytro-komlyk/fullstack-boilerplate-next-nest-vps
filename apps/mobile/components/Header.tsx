import { APP_NAME } from '@/keys';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';

export default function Header() {
  const { i18n } = useTranslation();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const toggleLanguage = async () => {
    const nextLang = i18n.language === 'en' ? 'uk' : 'en';
    await i18n.changeLanguage(nextLang);
  };
  return (
    <View className="flex-row items-center justify-between px-6 py-4 bg-white dark:bg-[#020617] border-b border-gray-100 dark:border-white/5">
      <View className="flex-row items-center gap-2">
        <View className="p-1.5 bg-brand-500 rounded-lg shadow-lg shadow-brand-500/20">
          <MaterialCommunityIcons name="orbit" size={20} color="white" />
        </View>
        <Text className="font-black text-navy-700 dark:text-white uppercase tracking-tighter">
          {APP_NAME}
        </Text>
      </View>

      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          onPress={toggleLanguage}
          className="flex-row items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full"
        >
          <MaterialCommunityIcons
            name="translate"
            size={16}
            color={isDark ? '#94a3b8' : '#64748b'}
          />
          <Text className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
            {i18n.language}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleColorScheme}
          className="p-2 bg-gray-100 dark:bg-white/5 rounded-full"
        >
          {isDark ? (
            <MaterialCommunityIcons name="weather-sunny" size={20} color="#fbbf24" />
          ) : (
            <MaterialCommunityIcons name="weather-night" size={20} color="#4318FF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
