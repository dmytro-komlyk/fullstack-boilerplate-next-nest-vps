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
      <h2 className="text-3xl font-black text-center mb-16 dark:text-white uppercase tracking-tighter">
        {t('title')}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 group relative overflow-hidden rounded-4xl bg-linear-to-br from-gray-900 to-navy-950 border border-white/10 p-8 md:p-12"
        >
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-brand-500/20 rounded-2xl border border-brand-500/30">
                  <LuShieldCheck className="text-brand-400 size-6" />
                </div>
                <h3 className="text-2xl font-bold text-white">{t('admin.title')}</h3>
              </div>
              <p className="text-gray-400 text-lg max-w-md mb-8">{t('admin.desc')}</p>
              <Button
                as={Link}
                href={adminUrl}
                color="primary"
                variant="flat"
                className="bg-brand-500 text-white font-bold h-12 px-8 rounded-xl"
                endContent={<LuLayoutDashboard className="size-4" />}
              >
                {t('admin.button')}
              </Button>
            </div>

            <div className="mt-12 -mb-20 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 opacity-40 group-hover:opacity-100">
              <div className="bg-navy-900 rounded-t-xl border-x border-t border-white/20 p-4 shadow-2xl">
                <div className="flex gap-2 mb-4">
                  <div className="size-2 rounded-full bg-red-500" />
                  <div className="size-2 rounded-full bg-yellow-500" />
                  <div className="size-2 rounded-full bg-green-500" />
                </div>
                <div className="h-40 bg-navy-800/50 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 relative overflow-hidden rounded-4xl bg-brand-500 border border-brand-400/20 p-8 md:p-12 text-white"
        >
          <div className="relative z-10 flex flex-col items-center text-center">
            <LuSmartphone className="size-12 mb-6 opacity-80" />
            <h3 className="text-2xl font-bold mb-4">{t('mobile.title')}</h3>
            <p className="text-brand-50 mb-8 text-sm opacity-90">{t('mobile.desc')}</p>

            <div className="bg-white p-4 rounded-3xl shadow-2xl mb-6 group-hover:scale-105 transition-transform">
              <div className="bg-gray-100 size-40 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                <LuQrCode className="size-24 text-navy-900" />
              </div>
            </div>

            <p className="text-xs font-mono tracking-widest uppercase opacity-70">
              {t('mobile.scan')}
            </p>
          </div>

          <div className="absolute -bottom-20 -right-20 size-64 bg-white/10 rounded-full blur-3xl" />
        </motion.div>
      </div>
    </section>
  );
};

export default EcosystemSection;
