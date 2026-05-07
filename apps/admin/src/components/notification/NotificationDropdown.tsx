'use client';

import { Badge } from '@heroui/react';
import { trpc } from '@package/api';
import { useTranslations } from 'next-intl';
import { type ReactNode, useState } from 'react';
import { BiSolidError } from 'react-icons/bi';
import { FaCircleInfo, FaSquareCheck } from 'react-icons/fa6';
import { GrStatusCritical } from 'react-icons/gr';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { RiErrorWarningFill } from 'react-icons/ri';

import Dropdown from '@/components/dropdown';

export type SeverityLevel = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'CRITICAL';

export const mapSeverityIcon: Record<SeverityLevel, ReactNode> = {
  INFO: <FaCircleInfo color="oklch(62.3% 0.214 259.815)" />,
  WARNING: <RiErrorWarningFill color="orange" />,
  ERROR: <BiSolidError color="oklch(63.7% 0.237 25.331)" />,
  SUCCESS: <FaSquareCheck color="green" />,
  CRITICAL: <GrStatusCritical color="oklch(50.5% 0.213 27.518)" />,
};

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('Common.Notifications');

  const { data, refetch } = trpc.notification.getAll.useQuery(
    { limit: 20, onlyUnread: false },
    { enabled: isOpen }
  );

  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const markAllAsRead = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      button={
        <Badge
          isInvisible={unreadCount === 0}
          size="sm"
          color="primary"
          content={unreadCount}
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
        {unreadCount > 0 && (
          <span className="rounded-full bg-brand-500 px-2 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
            {unreadCount}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 dark:bg-white/5">
            <IoMdNotificationsOutline className="size-10 text-gray-300 dark:text-white/20" />
          </div>
          <h5 className="mb-1 text-base font-bold text-navy-700 dark:text-white">
            {t('stayTuned')}
          </h5>
          <p className="max-w-50 text-sm font-medium text-gray-500 dark:text-gray-400">
            {t('description')}
          </p>
        </div>
      ) : (
        <ul className="flex max-h-80 flex-col gap-3 overflow-y-auto">
          {items.map((item) => (
            <li
              key={item.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl p-2 transition hover:bg-gray-50 dark:hover:bg-white/5 ${item.isRead ? 'opacity-60' : ''}`}
              onClick={() => !item.isRead && markAsRead.mutate({ id: item.id })}
            >
              <span className="mt-0.5 shrink-0 text-lg">
                {mapSeverityIcon[item.severity as SeverityLevel]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy-700 dark:text-white">
                  {item.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.message}</p>
              </div>
              {!item.isRead && (
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
              )}
            </li>
          ))}
        </ul>
      )}

      <button
        disabled={unreadCount === 0 || markAllAsRead.isPending}
        onClick={() => markAllAsRead.mutate()}
        className="w-full rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-600 transition duration-200 hover:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:disabled:text-gray-600"
      >
        {t('markAsRead')}
      </button>
    </Dropdown>
  );
};

export default NotificationDropdown;
