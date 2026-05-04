'use client';

import { Badge } from '@heroui/react';
import { ReactNode, useState } from 'react';
import { BiSolidError } from 'react-icons/bi';
import { FaCircleInfo, FaSquareCheck } from 'react-icons/fa6';
import { GrStatusCritical } from 'react-icons/gr';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { RiErrorWarningFill } from 'react-icons/ri';

import Dropdown from '@/components/dropdown';
import { useTranslations } from 'next-intl';

export type SeverityLevel = 'info' | 'warning' | 'error' | 'success' | 'critical';

export const mapSeverityIcon: Record<SeverityLevel, ReactNode> = {
  info: <FaCircleInfo color="oklch(62.3% 0.214 259.815)" />,
  warning: <RiErrorWarningFill color="orange" />,
  error: <BiSolidError color="oklch(63.7% 0.237 25.331)" />,
  success: <FaSquareCheck color="green" />,
  critical: <GrStatusCritical color="oklch(50.5% 0.213 27.518)" />,
};

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('Common.Notifications');

  const handleDropdownChange = async (value: boolean) => {
    setIsOpen(value);
  };

  const total = 0;
  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={handleDropdownChange}
      button={
        <Badge
          isInvisible={total === 0}
          size="sm"
          color="primary"
          content={total}
          shape="circle"
          classNames={{ badge: 'text-[8px]' }}
        >
          <button type="button" className="cursor-pointer border-none bg-transparent p-0">
            <IoMdNotificationsOutline className="size-5 text-gray-600 dark:text-white" />
          </button>
        </Badge>
      }
      classNames="py-2 top-4 -left-[230px] md:-left-[440px] w-max flex w-87.5 flex-col gap-4 rounded-[20px] bg-white p-6 shadow-xl sm:w-115 dark:bg-gray-800 dark:text-white"
    >
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-white/10">
        <h4 className="text-lg font-bold text-navy-700 dark:text-white">{t('title')}</h4>
        <span className="rounded-full bg-brand-500  px-2 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
          {t('comingSoon')}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 dark:bg-white/5">
          <IoMdNotificationsOutline className="size-10 text-gray-300 dark:text-white/20" />
        </div>
        <h5 className="mb-1 text-base font-bold text-navy-700 dark:text-white">{t('stayTuned')}</h5>
        <p className="max-w-50 text-sm font-medium text-gray-500 dark:text-gray-400">
          {t('description')}
        </p>
      </div>

      <button
        disabled
        className="w-full rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-400 transition duration-200 dark:bg-white/5"
      >
        {t('markAsRead')}
      </button>
    </Dropdown>
  );
};

export default NotificationDropdown;
