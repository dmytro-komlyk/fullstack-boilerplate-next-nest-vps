import React from 'react';
import { IconType } from 'react-icons';
import { RxDashboard, RxGear } from 'react-icons/rx';

interface IRoute {
  name: string;
  layout: string;
  path: string;
  icon: React.ReactNode | string;
}

const routes: IRoute[] = [
  {
    name: 'Dashboard',
    layout: '/',
    path: 'dashboard',
    icon: <RxDashboard className="h-6 w-6" />,
  },
  {
    name: 'Settings',
    layout: '/',
    path: 'settings',
    icon: <RxGear className="h-6 w-6" />,
  },
];

export interface SubRouteItem {
  path: string;
  name: string;
  icon: IconType;
}

export type SubRoutes = {
  [key: string]: SubRouteItem[];
};

export const subRoutes: SubRoutes = {};

export default routes;
