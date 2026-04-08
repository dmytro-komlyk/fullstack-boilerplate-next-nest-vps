'use client';

import { Divider } from '@heroui/divider';
import { usePathname } from 'next/navigation';
import React, { useCallback } from 'react';

import DashIcon from '@/components/icons/DashIcon';
import NavLink from '@/components/link/NavLink';
import type { RoutesType } from '@/types/navigation';
import { useTranslations } from 'next-intl';

const hiddenLinks: string[] = ['settings'];

export const SidebarLinks = (props: {
  routes: RoutesType[];
  onClick: () => void;
}): React.ReactNode => {
  const pathname = usePathname();
  const t = useTranslations('Common.Sidebar');

  const activeRoute = useCallback(
    (routeName: string) => {
      return pathname?.includes(routeName);
    },
    [pathname]
  );

  const createLinks = (routes: RoutesType[]) => {
    return routes.map((route) => {
      if (hiddenLinks.includes(route.path)) return;
      if (route.layout === '/' || route.layout === '/auth') {
        const translatedName = t.has(route.path) ? t(route.path) : route.name;

        return (
          <React.Fragment key={route.path}>
            {route.path === 'settings' && (
              <Divider className="mx-auto my-2 h-0.5 w-1/4 bg-gray-300 dark:bg-white/30" />
            )}
            <NavLink key={route.path} href={`/${route.path}`} onClick={props.onClick} className="">
              <div className="relative mb-3 flex hover:cursor-pointer">
                <li className="my-0.75 flex cursor-pointer items-center px-8" key={route.path}>
                  <span
                    className={`${
                      activeRoute(route.path) === true
                        ? 'text-brand-500 font-bold dark:text-white'
                        : 'font-medium text-gray-600'
                    }`}
                  >
                    {route.icon ? route.icon : <DashIcon />}
                  </span>
                  <p
                    className={`ml-4 flex min-h-full truncate ${
                      activeRoute(route.path) === true
                        ? 'text-navy-700 font-bold dark:text-white'
                        : 'font-medium text-gray-600'
                    }`}
                  >
                    {translatedName}
                  </p>
                </li>
                {activeRoute(route.path) ? (
                  <div className="bg-brand-500 dark:bg-brand-400 absolute top-px right-0 h-9 w-1 rounded-lg" />
                ) : null}
              </div>
            </NavLink>
          </React.Fragment>
        );
      }
    });
  };
  // BRAND
  return <>{createLinks(props.routes)}</>;
};

export default SidebarLinks;
