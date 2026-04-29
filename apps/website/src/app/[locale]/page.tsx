'use client';

import Header from '@/components/header/Header';
import { AiAssistantPlugin } from '@/components/plugins/AiAssistantPlugin';
import SettingsWidgetPlugin from '@/components/plugins/SettingsWidgetPlugin';
import { Button, Chip, Link } from '@heroui/react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  LuArrowRight,
  LuBox,
  LuGithub,
  LuLock,
  LuServer,
  LuShieldCheck,
  LuSmartphone,
  LuZap,
} from 'react-icons/lu';

export default function Home() {
  const t = useTranslations('Home');

  const techStack = [
    { name: 'Next.js 16', category: 'Frontend' },
    { name: 'Nest.js', category: 'Backend' },
    { name: 'Expo', category: 'Mobile' },
    { name: 'tRPC', category: 'API' },
    { name: 'Prisma', category: 'Database' },
    { name: 'Turborepo', category: 'Monorepo' },
    { name: 'Docker', category: 'DevOps' },
    { name: 'Zod', category: 'Validation' },
  ];

  const highlights = [
    {
      title: t('capabilities.items.truth.title'),
      desc: t('capabilities.items.truth.desc'),
      icon: <LuBox className="text-orange-500 size-6" />,
      color: 'bg-orange-500/10',
    },
    {
      title: t('capabilities.items.safety.title'),
      desc: t('capabilities.items.safety.desc'),
      icon: <LuZap className="text-brand-500 size-6" />,
      color: 'bg-brand-500/10',
    },
    {
      title: t('capabilities.items.mobile.title'),
      desc: t('capabilities.items.mobile.desc'),
      icon: <LuSmartphone className="text-purple-500 size-6" />,
      color: 'bg-purple-500/10',
    },
    {
      title: t('capabilities.items.devops.title'),
      desc: t('capabilities.items.devops.desc'),
      icon: <LuServer className="text-blue-500 size-6" />,
      color: 'bg-blue-500/10',
    },
    {
      title: t('capabilities.items.security.title'),
      desc: t('capabilities.items.security.desc'),
      icon: <LuShieldCheck className="text-green-500 size-6" />,
      color: 'bg-green-500/10',
    },
  ];

  return (
    <div className="relative min-h-screen bg-white dark:bg-navy-900 transition-colors duration-300 overflow-x-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-150 bg-linear-to-b from-brand-500/10 to-transparent pointer-events-none" />
      <Header />
      <SettingsWidgetPlugin />
      <AiAssistantPlugin />
      <main className="relative z-10 container mx-auto px-4 pt-40 pb-32">
        <div className="flex flex-col items-center text-center max-w-6xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Chip
              variant="flat"
              color="primary"
              className="mb-8 py-4 px-6 border-1 border-brand-500/20 bg-brand-500/5 text-brand-500 font-medium"
              startContent={<LuZap className="size-4" />}
            >
              {t('hero.badge')}
            </Chip>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-8xl font-black tracking-tight text-gray-900 dark:text-white mb-8 leading-[1.1]"
          >
            {t('hero.title_part1')}{' '}
            <span className="text-brand-500">{t('hero.title_highlight')}</span>{' '}
            <br className="hidden md:block" />
            {t('hero.title_part2')}
          </motion.h1>

          <motion.p
            dangerouslySetInnerHTML={{ __html: t.raw('hero.description') }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl leading-relaxed"
          />

          <div className="flex flex-wrap justify-center gap-4 mb-32">
            <Button
              as={Link}
              href="https://github.com/new?template_name=Omni-tRPC-Stack&template_owner=dmytro-komlyk"
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              color="primary"
              className="bg-brand-500 font-bold px-10 h-16 rounded-2xl text-white shadow-xl shadow-brand-500/30 text-lg transition-transform hover:scale-105"
              endContent={<LuArrowRight />}
            >
              {t('hero.buttons.get_started')}
            </Button>
            <Button
              as={Link}
              href="https://github.com/dmytro-komlyk/Omni-tRPC-Stack"
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              variant="bordered"
              className="font-bold px-10 h-16 rounded-2xl border-2 dark:text-white text-lg transition-transform hover:scale-105"
              startContent={<LuGithub />}
            >
              {t('hero.buttons.github')}
            </Button>
          </div>

          {/* Architecture Highlights - 5 Grid */}
          <div className="w-full mb-40">
            <h2 className="text-3xl font-black mb-16 text-gray-900 dark:text-white uppercase tracking-widest">
              {t('capabilities.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {highlights.map((item, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -5 }}
                  className={`p-8 rounded-4xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-brand-500/50 transition-all ${idx === 3 || idx === 4 ? 'lg:col-span-1' : ''}`}
                >
                  <div className={`${item.color} p-4 rounded-2xl w-fit mb-6`}>{item.icon}</div>
                  <h3 className="text-xl font-bold mb-3 dark:text-white">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Tech Stack Grid */}
          <div className="w-full max-w-4xl mb-40">
            <h2 className="text-2xl font-bold mb-10 text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">
              {t('tech_stack.title')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {techStack.map((tech, i) => (
                <div
                  key={i}
                  className="flex flex-col p-6 rounded-2xl bg-white dark:bg-navy-800 border border-gray-100 dark:border-white/5 shadow-sm"
                >
                  <span className="text-brand-500 font-black text-lg">{tech.name}</span>
                  <span className="text-[10px] uppercase tracking-tighter text-gray-400">
                    {tech.category}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex flex-wrap justify-center gap-8 border-t border-gray-100 dark:border-white/10 pt-16 w-full opacity-60 italic">
            <div className="flex items-center gap-3 px-6 py-3 bg-gray-50 dark:bg-white/5 rounded-full border border-gray-200 dark:border-white/10 text-xs font-mono dark:text-gray-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              {t('status.cicd')}
            </div>
            <div className="flex items-center gap-3 px-6 py-3 bg-gray-50 dark:bg-white/5 rounded-full border border-gray-200 dark:border-white/10 text-xs font-mono dark:text-gray-300">
              <LuLock className="size-3 text-brand-500" />
              {t('status.auth')}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
