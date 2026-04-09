'use client';

import { Button, Listbox, ListboxItem, Tooltip } from '@heroui/react';
import { useThemeCookieStore } from '@package/store/ui';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IoHelpBuoyOutline } from 'react-icons/io5';
import { RiMoonFill, RiSunFill } from 'react-icons/ri';
import Dropdown from '../dropdown';

const languages = [
  { key: 'en', label: 'English', flag: '🇺🇸', code: 'EN' },
  { key: 'uk', label: 'Українська', flag: '🇺🇦', code: 'UK' },
];

export default function SettingsWidgetPlugin() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useThemeCookieStore();
  const [mounted, setMounted] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const t = useTranslations('Common.SettingsWidget');

  const handleLocaleChange = (key: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${key}`);
    const currentParams = searchParams.toString();
    const finalPath = currentParams ? `${newPath}?${currentParams}` : newPath;
    router.push(finalPath);
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const currentLang = languages.find((lang) => lang.key === locale);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl bg-lightPrimary dark:bg-navy-900 fixed right-0 top-1/2 z-99 -translate-y-1/2"
    >
      <div className="shadow-shadow-500 flex flex-col gap-2 rounded-l-2xl border border-navy-700/10 bg-white/80 p-3 shadow-3xl backdrop-blur-2xl dark:border-white/10 dark:bg-navy-900/90 dark:shadow-none">
        <Tooltip
          content={t('language')}
          placement="left"
          offset={20}
          className="dark:bg-gray-800"
          isDisabled={isLangOpen}
        >
          <div className="flex items-center justify-center">
            <Dropdown
              isOpen={isLangOpen}
              onOpenChange={setIsLangOpen}
              placement="left"
              classNames="p-2 w-40 rounded-2xl bg-white dark:bg-navy-800 shadow-xl border-none"
              button={
                <Button
                  isIconOnly
                  variant="light"
                  className="h-10 w-10 min-w-10 rounded-xl"
                  onPress={() => setIsLangOpen(!isLangOpen)}
                >
                  <span className="text-sm font-bold uppercase text-navy-700 dark:text-brand-400">
                    {currentLang?.code}
                  </span>
                </Button>
              }
            >
              <Listbox
                aria-label="Language selection"
                disallowEmptySelection
                variant="flat"
                selectionMode="single"
                selectedKeys={new Set([locale])}
              >
                {languages.map((lang) => (
                  <ListboxItem
                    key={lang.key}
                    textValue={lang.label}
                    startContent={<span>{lang.flag}</span>}
                    onPress={() => {
                      handleLocaleChange(lang.key);
                      setIsLangOpen(false);
                    }}
                  >
                    {lang.label}
                  </ListboxItem>
                ))}
              </Listbox>
            </Dropdown>
          </div>
        </Tooltip>

        <div className="h-px w-full bg-gray-200 dark:bg-white/10" />

        <Tooltip
          key={theme}
          content={theme === 'dark' ? t('theme.light') : t('theme.dark')}
          placement="left"
          offset={15}
          className="dark:bg-gray-800"
        >
          <Button
            isIconOnly
            variant="light"
            className="h-10 w-10 rounded-xl"
            onPress={handleThemeToggle}
          >
            {theme === 'dark' ? (
              <RiSunFill key="sun" className="h-5 w-5 text-white" />
            ) : (
              <RiMoonFill key="moon" className="h-5 w-5 text-gray-500" />
            )}
          </Button>
        </Tooltip>

        <div className="h-px w-full bg-gray-200 dark:bg-white/10" />

        <Tooltip content={t('help')} placement="left" offset={15} className="dark:bg-gray-800">
          <Button
            isIconOnly
            variant="light"
            as="a"
            href="#"
            className="h-10 w-10 rounded-xl text-gray-500 dark:text-white"
          >
            <IoHelpBuoyOutline className="h-5 w-5" />
          </Button>
        </Tooltip>
      </div>
    </motion.div>
  );
}
