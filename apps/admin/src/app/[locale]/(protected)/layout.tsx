'use client';

import { useUIStore } from '@package/store/ui';
import React from 'react';

import Footer from '@/components/footer/Footer';
import LoadingPageSpinner from '@/components/loading/LoadingPageSpinner';
import Navbar from '@/components/navbar';
import { AiAssistantPlugin } from '@/components/plugins/AiAssistantPlugin';
import Sidebar from '@/components/sidebar';
import routes from '@/routes';

export const dynamic = 'force-dynamic';

export default function Admin({ children }: { children: React.ReactNode }) {
  const { isSideBarOpen, _hasHydrated } = useUIStore();

  if (!_hasHydrated) {
    return <LoadingPageSpinner wrapper="min-h-screen" />;
  }

  return (
    <div className="flex size-full">
      <Sidebar routes={routes} />
      {/* Navbar & Main Content */}
      <div
        className={`font-dm flex h-full w-auto grow flex-col transition-all duration-300 ease-in-out ${
          isSideBarOpen ? '2xl:ml-63.75' : 'xl:ml-0'
        } `}
      >
        {/* Main Content */}
        <main className="3xl:container flex min-h-screen w-full min-w-full flex-col px-4 transition-all 2xl:px-10">
          <AiAssistantPlugin />
          {/* Routes */}
          <Navbar routes={routes} />
          <div className="relative flex">
            <div
              className="absolute mx-4 my-4 min-h-[calc(100vh-140px)] inset-0 z-0 opacity-[0.07] dark:opacity-[0.1]"
              style={{
                backgroundImage: `linear-gradient(#4A5568 1px, transparent 1px), linear-gradient(90deg, #4A5568 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
              }}
            />
            <div className="mx-auto flex w-full min-h-[calc(100vh-200px)] grow p-2 pt-6! md:p-2">
              {children}
            </div>
          </div>
          <div className="mt-auto p-3">
            <Footer />
          </div>
        </main>
      </div>
      {/* <ChatFixedPlugin /> */}
    </div>
  );
}
