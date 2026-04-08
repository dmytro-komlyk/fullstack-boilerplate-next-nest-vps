'use client';

import {
  Link,
  Listbox,
  ListboxItem,
  ListboxSection,
  Image as NextUIImage,
  User,
} from '@heroui/react';
import { useThemeCookieStore, useUIStore } from '@package/store/ui';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { FiAlignJustify } from 'react-icons/fi';
import { LuLogOut } from 'react-icons/lu';
import { RiMoonFill, RiSunFill } from 'react-icons/ri';

import Dropdown from '@/components/dropdown';
import NavLink from '@/components/link/NavLink';
import NotificationDropdown from '@/components/notification/NotificationDropdown';
import GeneralTabs from '@/components/tabs/GeneralTabs';
import NavbarBreadcrumbs from './NavbarBreadcrumbs';

import { subRoutes } from '@/routes';
import type { IRoute } from '@/types/navigation';
import { getActiveRoute } from '@/utils/navigation';

import { useLogout } from '@/hooks/useLogout';
import avatar from '@/public/img/avatar.png';
import { useLocale, useTranslations } from 'next-intl';

interface INavbarProps {
  routes: IRoute[];
}

const languages = [
  { key: 'en', label: 'English', flag: '🇺🇸' },
  { key: 'uk', label: 'Українська', flag: '🇺🇦' },
];

const Navbar = ({ routes }: INavbarProps) => {
  const locale = useLocale();
  const t = useTranslations('Common.Navbar');
  const tSidebar = useTranslations('Common.Sidebar');
  const tBreadcrumbs = useTranslations('Common.Breadcrumbs');
  const router = useRouter();
  const pathname = usePathname();
  const activeRoute = getActiveRoute(routes, pathname);
  const { data: session } = useSession();
  const { handleLogout, isLoading } = useLogout();
  const [isOpen, setIsOpen] = useState(false);
  const { isSideBarOpen, setSideBarOpen } = useUIStore();
  const { theme, setTheme } = useThemeCookieStore();
  const [isLangOpen, setIsLangOpen] = useState(false);

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const onSignOutClick = async () => {
    await handleLogout();
  };

  const handleDropdownChange = async (isOpen: boolean) => {
    setIsOpen(isOpen);
  };

  const handleLocaleChange = (key: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${key}`);
    router.push(newPath);
  };

  const tabs = subRoutes[activeRoute.path.toLowerCase()] || [];

  console.log(activeRoute.name);

  return (
    <nav className="sticky top-4 z-40 flex flex-row flex-wrap items-center justify-between rounded-xl bg-white/10 p-2 backdrop-blur-xl dark:bg-[#0b14374d]">
      <div className="flex flex-col">
        {/* Breadcrumbs */}
        <NavbarBreadcrumbs />
        {/* Show tabs */}
        {tabs.length > 0 ? (
          <div className="mt-1">
            <GeneralTabs
              tabs={subRoutes[activeRoute.path.toLowerCase()] || []}
              sectionKey={activeRoute.path.toLowerCase()}
            />
          </div>
        ) : (
          <p className="shrink px-2 pt-3 text-xl text-gray-800 capitalize dark:text-white">
            <NavLink href="#" className="font-bold capitalize">
              {tBreadcrumbs(activeRoute.name.toString().toLocaleLowerCase())}
            </NavLink>
          </p>
        )}
      </div>
      <div className="shadow-shadow-500 dark:bg-navy-800! relative flex h-15.25 w-50 max-w-50 grow items-center justify-around gap-2 rounded-full bg-white p-2 shadow-xl md:grow-0 dark:shadow-none">
        <span
          className="flex cursor-pointer text-xl text-gray-600 dark:text-white"
          onClick={() => setSideBarOpen(!isSideBarOpen)}
        >
          <FiAlignJustify className="size-5" />
        </span>
        {/* Notification */}
        <NotificationDropdown />
        {/* Language */}
        <Dropdown
          isOpen={isLangOpen}
          onOpenChange={setIsLangOpen}
          placement="bottom-end"
          button={
            <button className="flex cursor-pointer items-center text-sm font-bold uppercase text-gray-600 dark:text-white outline-none">
              {locale}
            </button>
          }
          classNames="py-2 px-1 w-48 shadow-shadow-500 rounded-2xl bg-white dark:bg-gray-800 dark:text-white"
        >
          <Listbox
            aria-label="Select Language"
            disallowEmptySelection
            selectedKeys={[locale]}
            selectionMode="single"
            variant="flat"
          >
            {languages.map((lang) => (
              <ListboxItem
                key={lang.key}
                onPress={() => {
                  handleLocaleChange(lang.key);
                  setIsLangOpen(false);
                }}
                startContent={<span>{lang.flag}</span>}
                className="rounded-xl transition-colors data-[hover=true]:bg-gray-100 dark:data-[hover=true]:bg-white/10"
              >
                <span className="text-sm font-medium">{lang.label}</span>
              </ListboxItem>
            ))}
          </Listbox>
        </Dropdown>
        {/* Theme */}
        <button
          type="button"
          onClick={handleThemeToggle}
          className="flex cursor-pointer items-center gap-2 rounded bg-transparent text-gray-600 dark:text-white"
        >
          {theme === 'dark' ? (
            <RiSunFill className="size-4 text-gray-600 dark:text-white" />
          ) : (
            <RiMoonFill className="size-4 text-gray-600 dark:text-white" />
          )}
        </button>
        {/* Profile & Dropdown */}
        <Dropdown
          isOpen={isOpen}
          onOpenChange={handleDropdownChange}
          button={
            <NextUIImage
              as={Image}
              width={35}
              height={35}
              className="cursor-pointer rounded-full"
              src={avatar.src}
              alt="User avatar"
            />
          }
          classNames="pt-4 top-10 -left-[210px] w-max shadow-shadow-500 flex w-64 flex-col rounded-2xl bg-white shadow-xl dark:bg-gray-800 dark:text-white dark:shadow-none"
        >
          {/* Header */}
          <div className="mb-4 flex justify-start px-2">
            <User
              avatarProps={{
                size: 'sm',
                src: session?.user.avatarUrl || undefined,
                classNames: {
                  base: 'bg-gray-700 text-white',
                },
              }}
              classNames={{
                name: 'text-text-center font-semibold text-gray-900 dark:text-white',
              }}
              name={`${session?.user?.nickName}`}
              description={session?.user?.email}
            />
          </div>

          {/* Divider */}
          <div className="mb-2 h-px w-full bg-gray-200 dark:bg-white/20" />

          {/* Menu items */}
          <div className="flex w-full flex-col gap-1">
            <Listbox aria-label="Listbox menu with sections" variant="flat">
              <ListboxSection showDivider={routes.length > 0}>
                {routes.map((route) => {
                  const translatedName = tSidebar.has(route.path.toLowerCase())
                    ? tSidebar(route.path.toLowerCase())
                    : route.name;

                  return (
                    <ListboxItem
                      key={route.path}
                      as={Link}
                      href={`${route.layout}${route.path}`}
                      startContent={
                        <div className="text-gray-600 dark:text-white">{route.icon}</div>
                      }
                      className="h-10 rounded-xl transition-colors data-[hover=true]:bg-gray-100 dark:data-[hover=true]:bg-white/10"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {translatedName}
                      </span>
                    </ListboxItem>
                  );
                })}
              </ListboxSection>

              <ListboxSection>
                <ListboxItem
                  key="logout"
                  color="danger"
                  onPress={onSignOutClick}
                  endContent={<LuLogOut className="size-5 text-red-500 hover:text-red-600" />}
                  classNames={{
                    title: 'text-sm font-medium text-red-500 hover:text-red-600 lg:text-base',
                  }}
                  isDisabled={isLoading}
                >
                  {t('logout')}
                </ListboxItem>
              </ListboxSection>
            </Listbox>
          </div>
        </Dropdown>
      </div>
    </nav>
  );
};

export default Navbar;
