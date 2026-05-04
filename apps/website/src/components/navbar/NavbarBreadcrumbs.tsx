'use client';

import { BreadcrumbItem, Breadcrumbs } from '@heroui/react';
import { usePathname } from 'next/navigation';

import NavLink from '@/components/link/NavLink';
import { useLocale, useTranslations } from 'next-intl';

const NavbarBreadcrumbs = () => {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('Common.Breadcrumbs');
  const segments = pathname
    .split('/')
    .filter(Boolean)
    .filter((segment) => segment !== locale);

  const breadcrumbs = segments.map((segment, idx) => {
    const href = `/${locale}/${segments.slice(0, idx + 1).join('/')}`;
    const translationKey = segment.toLowerCase();
    const label = t.has(translationKey)
      ? t(translationKey)
      : segment.charAt(0).toUpperCase() + segment.slice(1);

    return (
      <BreadcrumbItem key={href}>
        <NavLink href={href}>{label}</NavLink>
      </BreadcrumbItem>
    );
  });

  return (
    <Breadcrumbs
      radius="full"
      variant="solid"
      classNames={{
        list: 'text-gray-800 dark:!bg-navy-800 bg-white px-3 dark:shadow-none',
      }}
    >
      <BreadcrumbItem>
        <NavLink href="/">{t('home')}</NavLink>
      </BreadcrumbItem>
      {breadcrumbs}
    </Breadcrumbs>
  );
};

export default NavbarBreadcrumbs;
