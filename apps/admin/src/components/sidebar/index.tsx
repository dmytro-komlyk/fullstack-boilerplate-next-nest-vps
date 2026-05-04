'use client';

import {
  Button,
  Divider,
  Drawer,
  DrawerContent,
  Link as NextUILink,
  useDisclosure,
} from '@heroui/react';
import { useUIStore } from '@package/store/ui';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { IoClose } from 'react-icons/io5';

import DashIcon from '@/components/icons/DashIcon';
import NavLink from '@/components/link/NavLink';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { appName, websiteUrl } from '@/utils/constants';

import type { IRoute } from '@/types/navigation';
import { useTranslations } from 'next-intl';
import Links from './components/Links';

interface ISidebarProps {
  routes: IRoute[];
}

const Sidebar = ({ routes }: ISidebarProps) => {
  const t = useTranslations('Common.Sidebar');
  const pathname = usePathname();
  const { isSideBarOpen, setSideBarOpen } = useUIStore();
  const { onOpenChange } = useDisclosure({
    isOpen: isSideBarOpen,
    onChange: setSideBarOpen,
  });

  const isXl = useMediaQuery('(min-width: 1280px)');

  const settingsRoute = routes.find((route) => route.path === 'settings');

  const activeRoute = useCallback(
    (routeName: string) => {
      return pathname?.includes(routeName);
    },
    [pathname]
  );

  const handleLinkClick = useCallback(() => {
    if (!isXl) {
      setSideBarOpen(false);
    }
  }, [isXl, setSideBarOpen]);

  const sidebarVariants = {
    hidden: {
      x: -80,
      opacity: 0,
      filter: 'blur(10px)',
    },
    show: {
      x: 0,
      opacity: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.1,
        ease: 'easeOut',
        filter: { duration: 0.4 },
        opacity: { duration: 0.3, delay: 0.1 },
      },
    },
    exit: {
      x: -60,
      opacity: 0,
      filter: 'blur(8px)',
      transition: {
        duration: 0.2,
        ease: 'easeIn',
      },
    },
  } as const;

  const sidebarContent = (
    <>
      <div className="relative flex h-20 items-center justify-center px-10 py-5">
        <NextUILink
          as={Link}
          className="text-landing-dark-grey-900 text-2xl font-extrabold dark:text-white"
          href={`${websiteUrl}`}
        >
          {appName}
        </NextUILink>
        {!isXl && (
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={handleLinkClick}
            aria-label="Close sidebar"
            className="absolute top-2 right-2 size-fit min-w-fit rounded-full p-1 hover:bg-gray-300/50! dark:hover:bg-gray-800!"
          >
            <IoClose size={16} />
          </Button>
        )}
      </div>
      <Divider className="mb-8 bg-gray-300 dark:bg-white/30" />
      <ul className="pt-1">
        <Links routes={routes} onClick={handleLinkClick} />
      </ul>
      <Divider className="my-4 mt-7 bg-gray-300 dark:bg-white/30" />
      {settingsRoute && (
        <NavLink
          className="mb-2"
          key={settingsRoute.path}
          href={`/${settingsRoute.path}`}
          onClick={handleLinkClick}
        >
          <div className="relative mb-3 flex hover:cursor-pointer">
            <li className="my-0.75 flex cursor-pointer items-center px-8" key={settingsRoute.path}>
              <span
                className={`${
                  activeRoute(settingsRoute.path) === true
                    ? 'text-brand-500 font-bold dark:text-white'
                    : 'font-medium text-gray-600'
                }`}
              >
                {settingsRoute.icon ? settingsRoute.icon : <DashIcon />}
              </span>
              <p
                className={`ml-4 flex min-h-full ${
                  activeRoute(settingsRoute.path) === true
                    ? 'text-navy-700 font-bold dark:text-white'
                    : 'font-medium text-gray-600'
                }`}
              >
                {t.has(settingsRoute.path) ? t(settingsRoute.path) : settingsRoute.name}
              </p>
            </li>
            {activeRoute(settingsRoute.path) ? (
              <div className="bg-brand-500 dark:bg-brand-400 absolute top-px right-0 h-9 w-1 rounded-lg" />
            ) : null}
          </div>
        </NavLink>
      )}
    </>
  );

  if (!isXl) {
    return (
      <Drawer
        hideCloseButton
        placement="left"
        size="xs"
        classNames={{
          backdrop: 'min-w-full h-screen min-h-full',
          wrapper: 'min-w-full',
          base: 'sm:data-[placement=right]:m-2 sm:data-[placement=left]:m-2 rounded-2xl max-w-[255px] min-h-[calc(100%-30px)]',
        }}
        isOpen={isSideBarOpen}
        onOpenChange={onOpenChange}
      >
        <DrawerContent className="dark:bg-navy-800 bg-white">{sidebarContent}</DrawerContent>
      </Drawer>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {isSideBarOpen && (
        <motion.div
          key="sidebar"
          variants={sidebarVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          className={`sm:none linear dark:bg-navy-800! dark:shadow-navy-800/5 fixed! z-50! m-4 flex flex-col rounded-xl bg-white shadow-xl transition-all duration-300 ease-in-out xl:static xl:left-auto xl:h-[calc(100%-35px)] xl:min-h-[calc(100%-35px)] dark:text-white ${isSideBarOpen ? 'xl:w-63.75' : 'xl:w-0 xl:overflow-hidden'} `}
        >
          {sidebarContent}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
