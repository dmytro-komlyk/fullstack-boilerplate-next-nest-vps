'use client';

import { appName, baseUrl } from '@/utils/constants';
import {
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
  User,
} from '@heroui/react';
import { useSession } from '@package/next-auth';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { LuLayoutDashboard, LuLogOut, LuOrbit, LuUser } from 'react-icons/lu';

import { useLogout } from '@/hooks/useLogout';

const Header = () => {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { handleLogout, isLoading } = useLogout();
  const t = useTranslations('Home.header');

  const navLinks = [
    { label: t('nav.features'), href: '#features' },
    { label: t('nav.documentation'), href: '#documentation' },
  ];

  return (
    <Navbar
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      maxWidth="xl"
      isBordered
      className="fixed top-0 bg-white/70 backdrop-blur-md dark:bg-navy-900/70"
      classNames={{
        wrapper: 'px-4 sm:px-6',
        item: [
          'flex',
          'relative',
          'h-full',
          'items-center',
          "data-[active=true]:after:content-['']",
          'data-[active=true]:after:absolute',
          'data-[active=true]:after:bottom-0',
          'data-[active=true]:after:left-0',
          'data-[active=true]:after:right-0',
          'data-[active=true]:after:h-[2px]',
          'data-[active=true]:after:rounded-[2px]',
          'data-[active=true]:after:bg-brand-500',
        ],
      }}
    >
      {/* Left side: Logo & Mobile Toggle */}
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          className="sm:hidden"
        />
        <NavbarBrand>
          <Link href={baseUrl} className="flex items-center gap-2 group">
            <div className="bg-brand-500 p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
              <LuOrbit className="text-white size-5" />
            </div>
            <span className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              {appName}
            </span>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      {/* Center: Main Navigation (Desktop) */}
      <NavbarContent className="hidden sm:flex gap-8" justify="center">
        {navLinks.map((link) => (
          <NavbarItem key={link.href}>
            <Link
              color="foreground"
              href={`${baseUrl}${link.href}`}
              className="text-sm font-semibold hover:text-brand-500 transition-colors"
            >
              {link.label}
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>

      {/* Right side: User Profile or Auth Buttons */}
      <NavbarContent justify="end">
        {session ? (
          <Dropdown placement="bottom-end" className="min-w-60">
            <DropdownTrigger>
              <Avatar
                as="button"
                isBordered
                color="primary"
                className="cursor-pointer transition-transform hover:scale-105"
                name={session.user.nickName || session.user.email?.[0]}
                size="sm"
                src={session.user.avatarUrl || undefined}
              />
            </DropdownTrigger>

            <DropdownMenu aria-label="User actions" variant="flat">
              <DropdownSection showDivider>
                <DropdownItem isReadOnly key="user-info" className="h-14 gap-2">
                  <User
                    name={session.user.nickName || 'User'}
                    description={session.user.email}
                    avatarProps={{
                      src: session.user.avatarUrl || undefined,
                      size: 'sm',
                    }}
                  />
                </DropdownItem>
              </DropdownSection>

              <DropdownSection showDivider>
                <DropdownItem
                  key="dashboard"
                  as={Link}
                  href={`${baseUrl}/dashboard`}
                  startContent={<LuLayoutDashboard className="size-4" />}
                >
                  {t('user.dashboard')}
                </DropdownItem>
                <DropdownItem
                  key="profile"
                  as={Link}
                  href={`${baseUrl}/profile`}
                  startContent={<LuUser className="size-4" />}
                >
                  {t('user.profile')}
                </DropdownItem>
              </DropdownSection>

              <DropdownItem
                key="logout"
                color="danger"
                className="text-danger"
                isDisabled={isLoading}
                startContent={
                  isLoading ? (
                    <div className="animate-spin size-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <LuLogOut className="size-4" />
                  )
                }
                onPress={() => handleLogout('manual')}
              >
                {isLoading ? t('user.logging_out') : t('user.logout')}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <NavbarItem className="flex gap-3">
            <Button
              as={Link}
              href={`${baseUrl}/auth/sign-in`}
              variant="light"
              className="font-bold hidden md:flex"
            >
              {t('auth.login')}
            </Button>
            <Button
              as={Link}
              href={`${baseUrl}/auth/sign-up`}
              color="primary"
              className="bg-brand-500 font-bold shadow-lg shadow-brand-500/20 px-6 rounded-xl text-white"
            >
              {t('auth.signup')}
            </Button>
          </NavbarItem>
        )}
      </NavbarContent>

      {/* Mobile Menu (Sidebar) */}
      <NavbarMenu className="pt-6 bg-white/80 backdrop-blur-md">
        {navLinks.map((item, index) => (
          <NavbarMenuItem key={`${item.label}-${index}`}>
            <Link
              className="w-full text-lg font-medium py-2"
              color="foreground"
              href={`${baseUrl}${item.href}`}
              size="lg"
              onPress={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  );
};

export default Header;
