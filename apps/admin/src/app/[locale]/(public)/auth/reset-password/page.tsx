import ResetPassword from '@/components/auth/ResetPassword';
import Default from '@/components/auth/variants/DefaultAuthLayout';
import { getRemoteServerClient } from '@package/api/server';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { LuKeyRound } from 'react-icons/lu';

async function ResetPasswordDefault({
  searchParams,
}: {
  searchParams: Promise<{ token: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    redirect('/auth/sign-in');
  }

  const serverClient = getRemoteServerClient();
  const tokenValid = await serverClient.auth.checkToken.query({ token });
  const t = await getTranslations('Auth.ResetPassword.Admin');
  const requirements = t.raw('requirements') as string[];

  return (
    <Default
      maincard={
        <div className="relative flex h-full w-full items-center justify-center px-4">
          <div className="z-10 w-full max-w-112.5 overflow-hidden rounded-3xl border-1 border-navy-700/10 bg-white/80 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-navy-900/90">
            <div className="flex items-center justify-between bg-amber-500 px-8 py-3 dark:bg-amber-600">
              <div className="flex items-center gap-2">
                <LuKeyRound className="size-4 text-white" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
                  {t('badge')}
                </span>
              </div>
              <div className="flex gap-1.5">
                <div className="size-2 rounded-full bg-white/20" />
                <div className="size-2 rounded-full bg-white/20" />
              </div>
            </div>

            <div className="p-8 md:p-10">
              <h3 className="mb-2 text-3xl font-black tracking-tight text-navy-800 dark:text-white">
                {t('title')}
              </h3>
              <p
                className="mb-8 text-sm font-medium text-gray-500 dark:text-gray-400"
                dangerouslySetInnerHTML={{
                  __html: t.raw('description').replace('{email}', tokenValid.email as string),
                }}
              />

              <ResetPassword token={token} email={tokenValid.email as string} />

              <div className="mt-8 space-y-2 rounded-2xl border-1 border-dashed border-gray-200 p-4 dark:border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {t('requirementsTitle')}
                </p>
                <ul className="list-inside list-disc text-[11px] text-gray-500 dark:text-gray-400">
                  {requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}

export default ResetPasswordDefault;
