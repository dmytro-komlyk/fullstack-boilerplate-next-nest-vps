'use client';

import { adminUrl } from '@/utils/constants';
import { Button, Link } from '@heroui/react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { LuLayoutDashboard, LuQrCode, LuShieldCheck, LuSmartphone } from 'react-icons/lu';

const EcosystemSection = () => {
  const t = useTranslations('Home.ecosystem');

  return (
    <section className="w-full mb-40 px-4">
      <h2 className="text-3xl font-black text-center mb-16 text-navy-700 dark:text-white uppercase tracking-tighter">
        {t('title')}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 group relative overflow-hidden rounded-4xl p-8 md:p-12 shadow-sm border border-gray-200 dark:border-white/10 
             bg-linear-to-br from-gray-50 via-white to-navy-50 
             dark:bg-linear-to-br dark:from-navy-800 dark:via-navy-800 dark:to-navy-900"
        >
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-brand-500/10 dark:bg-brand-500/20 rounded-2xl border border-brand-500/20 dark:border-brand-500/30">
                  <LuShieldCheck className="text-brand-500 dark:text-brand-400 size-6" />
                </div>
                <h3 className="text-2xl font-bold text-navy-700 dark:text-white">
                  {t('admin.title')}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg max-w-md mb-8">
                {t('admin.desc')}
              </p>
              <Button
                as={Link}
                href={adminUrl}
                color="primary"
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-brand-500/20 transition-all"
                endContent={<LuLayoutDashboard className="size-4" />}
              >
                {t('admin.button')}
              </Button>
            </div>

            <div className="mt-12 -mb-20 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 opacity-50 group-hover:opacity-100">
              <div className="bg-white dark:bg-navy-900 rounded-t-xl border-x border-t border-gray-200 dark:border-white/20 p-4 shadow-2xl">
                <div className="flex gap-2 mb-4">
                  <div className="size-2 rounded-full bg-red-400" />
                  <div className="size-2 rounded-full bg-yellow-400" />
                  <div className="size-2 rounded-full bg-green-400" />
                </div>
                <div className="h-40 bg-gray-50 dark:bg-navy-800/50 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 relative overflow-hidden rounded-4xl bg-brand-500 border border-brand-400/20 p-8 md:p-12 text-white shadow-xl shadow-brand-500/20"
        >
          <div className="relative z-10 flex flex-col items-center text-center">
            <LuSmartphone className="size-12 mb-6 text-white/90" />
            <h3 className="text-2xl font-bold mb-4">{t('mobile.title')}</h3>
            <p className="text-brand-50 mb-8 text-sm opacity-90">{t('mobile.desc')}</p>

            <div className="bg-white p-4 rounded-3xl shadow-2xl mb-6 group-hover:rotate-3 transition-transform duration-300">
              <div className="bg-gray-50 size-40 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200">
                <LuQrCode className="size-24 text-navy-900" />
              </div>
            </div>

            <p className="text-xs font-mono tracking-widest uppercase text-white/70">
              {t('mobile.scan')}
            </p>
          </div>

          <div className="absolute -bottom-20 -right-20 size-64 bg-white/20 rounded-full blur-3xl" />
        </motion.div>
      </div>
    </section>
  );
};

export default EcosystemSection;
