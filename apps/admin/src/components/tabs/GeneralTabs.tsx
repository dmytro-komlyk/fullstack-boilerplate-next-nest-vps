'use client';

import { SubRouteItem } from '@/routes';
import { Link, Tab, Tabs } from '@heroui/react';
import { usePathname } from 'next/navigation';
import React from 'react';

interface GeneralTabsProps {
  tabs: SubRouteItem[];
  sectionKey: string;
}

const GeneralTabs: React.FC<GeneralTabsProps> = ({ tabs, sectionKey }) => {
  const pathname = usePathname();

  const activeTab: string =
    tabs.find((tab) => {
      const href = tab.path === sectionKey ? `/${sectionKey}` : `/${sectionKey}/${tab.path}`;
      return pathname === href;
    })?.path ||
    tabs[0]?.path ||
    '';

  return (
    <Tabs
      aria-label={`${sectionKey} tabs`}
      selectedKey={activeTab}
      variant="underlined"
      radius="md"
      size="md"
      classNames={{
        tabList: 'w-full gap-6',
        tab: 'max-w-fit h-auto pb-2',
        cursor: 'h-1 rounded w-full bg-brand-500 dark:bg-brand-400',
        tabContent: [
          'shrink text-xl capitalize font-semibold text-gray-800 dark:text-white',
          'group-data-[selected=true]:text-gray-800',
          'dark:group-data-[selected=true]:text-white',
        ],
      }}
    >
      {tabs.map(({ path, name, icon: Icon }) => {
        const href = path === sectionKey ? `/${sectionKey}` : `/${sectionKey}/${path}`;

        return (
          <Tab
            key={path}
            title={
              <div
                className={`flex items-center space-x-2 ${
                  activeTab === path
                    ? 'text-brand-500 font-bold dark:text-white'
                    : 'font-medium text-gray-600'
                }`}
              >
                <Icon className="size-6" />
                <span
                  className={`ml-4 flex text-sm leading-1 sm:leading-7 md:text-base ${
                    activeTab === path
                      ? 'text-navy-700 font-bold dark:text-white'
                      : 'font-medium text-gray-600'
                  }`}
                >
                  {name}
                </span>
              </div>
            }
            as={Link}
            href={href}
          />
        );
      })}
    </Tabs>
  );
};

export default GeneralTabs;
