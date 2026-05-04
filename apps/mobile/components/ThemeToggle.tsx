import { useColorScheme } from 'nativewind';
import { LuMoon, LuSun } from 'react-icons/lu';
import { TouchableOpacity } from 'react-native';

export const ThemeToggle = () => {
  const { colorScheme, toggleColorScheme } = useColorScheme();

  return (
    <TouchableOpacity
      onPress={toggleColorScheme}
      className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10"
    >
      {colorScheme === 'dark' ? (
        <LuSun size={20} color="#fbbf24" />
      ) : (
        <LuMoon size={20} color="#64748b" />
      )}
    </TouchableOpacity>
  );
};
