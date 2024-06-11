import { locales } from '@client/config';
import { cookies } from 'next/headers';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  getTranslations,
  unstable_setRequestLocale as setRequestLocale,
} from 'next-intl/server';

import LocaleSwitcher from '../(components)/LocaleSwitcher';
import ThemeToggle from '../(components)/ThemeToggle';
import TrpcExample from '../(components)/TrpcExample';
import { serverClient } from '../(utils)/trpc/serverClient';

type Props = {
  params: { locale: string };
};

export const dynamic = 'force-dynamic';

export default async function Home({ params: { locale } }: Props) {
  const exampleTrpcData = await serverClient.example.getAll();
  const cookieStore = cookies();
  const theme = cookieStore.get('theme');
  const t = await getTranslations('IndexPage');
  const isValidLocale = locales.some((cur) => cur === locale);
  if (!isValidLocale) notFound();
  // Enable static rendering
  setRequestLocale(locale);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-slate-200 p-24 dark:bg-slate-700">
      <div className="flex max-w-5xl">
        <ThemeToggle initialValue={theme?.value as 'light' | 'dark'} />
        <LocaleSwitcher />
      </div>
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 text-black backdrop-blur-2xl lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-300 lg:p-4">
          Get started by editing&nbsp;
          <code className="font-mono font-bold">app/page.tsx</code>
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white lg:static lg:size-auto lg:bg-none">
          <a
            className="pointer-events-none flex place-items-center gap-2 p-8 text-black dark:text-white lg:pointer-events-auto lg:p-0"
            href="https://vercel.com?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            By{' '}
            <Image
              src="/vercel.svg"
              alt="Vercel Logo"
              className="dark:invert"
              width={100}
              height={24}
              priority
            />
          </a>
        </div>
      </div>

      <div className="relative z-0 flex place-items-center gap-x-10 before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-slate-500 before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px]">
        <Image
          className="relative drop-shadow-[0_0_0.3rem_#ffffff70] dark:invert"
          src="/next.svg"
          alt="Next.js Logo"
          width={180}
          height={37}
          priority
        />
      </div>

      <div>
        <h2 className="text-2xl text-slate-700 dark:text-slate-50">
          {t.rich('title', { code: (chunks) => <code>{chunks}</code> })}
        </h2>
        <p className="text-sm text-slate-700 dark:text-slate-50">
          {' '}
          {t.rich('description', {
            code: (chunks) => <code className="font-mono">{chunks}</code>,
          })}
        </p>
      </div>

      <div className="z-10 mb-32 grid gap-3 text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left">
        <a
          href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 text-slate-700 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:text-black dark:text-slate-50 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30 hover:dark:text-white"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className="mb-3 text-2xl font-semibold">
            Docs{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Find in-depth information about Next.js features and API.
          </p>
        </a>

        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 text-slate-700 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:text-black dark:text-slate-50 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30 hover:dark:text-white"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className="mb-3 text-2xl font-semibold">
            Learn{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Learn about Next.js in an interactive course with&nbsp;quizzes!
          </p>
        </a>

        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 text-slate-700 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:text-black dark:text-slate-50 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30 hover:dark:text-white"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className="mb-3 text-2xl font-semibold">
            Templates{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Explore the Next.js 13 playground.
          </p>
        </a>

        <a
          href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 text-slate-700 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:text-black dark:text-slate-50 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30 hover:dark:text-white"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className="mb-3 text-2xl font-semibold">
            Deploy{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Instantly deploy your Next.js site to a shareable URL with Vercel.
          </p>
        </a>
      </div>

      <div className="text-slate-700 dark:text-slate-200">
        <TrpcExample initialText={exampleTrpcData[0]} />
      </div>
    </main>
  );
}
