'use client';

import { Avatar, Card, CardBody, CardHeader, Chip, Progress, Spinner } from '@heroui/react';
import { trpc } from '@package/api/client';
import { ReactNode, useMemo } from 'react';
import { HiMiniComputerDesktop, HiMiniEnvelope, HiMiniSignal, HiMiniUsers } from 'react-icons/hi2';
import { UAParser } from 'ua-parser-js';

import { relativeTime } from '@/helpers/date';
import { buildDistribution } from '@/helpers/ua';

function StatCard({
  label,
  value,
  sub,
  icon,
  iconBg,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: ReactNode;
  iconBg: string;
}) {
  return (
    <Card className="border border-gray-200/30 dark:border-white/5 dark:bg-navy-800">
      <CardBody className="flex flex-row items-center gap-4 p-5">
        <div className={`shrink-0 rounded-xl p-3 ${iconBg}`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-navy-700 dark:text-white">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
        </div>
      </CardBody>
    </Card>
  );
}

function DistributionList({
  title,
  items,
}: {
  title: string;
  items: { name: string; count: number }[];
}) {
  const total = items.reduce((s, i) => s + i.count, 0);
  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">{title}</p>
      <div className="flex flex-col gap-2">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400">No data</p>
        ) : (
          items.map(({ name, count }) => (
            <div key={name} className="flex items-center gap-2">
              <span className="w-28 shrink-0 text-right text-sm text-gray-600 dark:text-gray-300">
                {name}
              </span>
              <Progress
                aria-label={name}
                value={total > 0 ? (count / total) * 100 : 0}
                size="sm"
                className="flex-1"
                classNames={{ indicator: 'bg-brand-500' }}
              />
              <span className="w-7 text-right text-xs font-medium text-gray-500">{count}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = trpc.user.getStats.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const distribution = useMemo(
    () => (data ? buildDistribution(data.sessions.userAgents) : null),
    [data]
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) return null;

  const { users, sessions, invites } = data;

  return (
    <div className="flex flex-col gap-6 p-2">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Total users"
          value={users.total}
          sub={`+${users.newThisWeek} this week`}
          icon={<HiMiniUsers className="h-5 w-5 text-brand-500" />}
          iconBg="bg-brand-50 dark:bg-brand-500/10"
        />
        <StatCard
          label="Online now"
          value={users.online}
          sub={`+${users.newThisMonth} this month`}
          icon={<HiMiniSignal className="h-5 w-5 text-green-500" />}
          iconBg="bg-green-50 dark:bg-green-500/10"
        />
        <StatCard
          label="Active sessions"
          value={sessions.active}
          sub={`${sessions.total} total`}
          icon={<HiMiniComputerDesktop className="h-5 w-5 text-blue-500" />}
          iconBg="bg-blue-50 dark:bg-blue-500/10"
        />
        <StatCard
          label="Pending invites"
          value={invites.pending}
          sub={`${invites.accepted} accepted · ${invites.expired} expired`}
          icon={<HiMiniEnvelope className="h-5 w-5 text-amber-500" />}
          iconBg="bg-amber-50 dark:bg-amber-500/10"
        />
      </div>

      {/* User breakdown + Session UA breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border border-gray-200/30 dark:border-white/5 dark:bg-navy-800">
          <CardHeader className="pb-1">
            <p className="font-semibold text-navy-700 dark:text-white">User breakdown</p>
          </CardHeader>
          <CardBody className="flex flex-col gap-6 pt-2">
            <DistributionList
              title="By role"
              items={users.byRole.map((r) => ({ name: r.role, count: r.count }))}
            />
            <DistributionList
              title="By status"
              items={users.byStatus.map((s) => ({ name: s.status, count: s.count }))}
            />
          </CardBody>
        </Card>

        <Card className="border border-gray-200/30 dark:border-white/5 dark:bg-navy-800">
          <CardHeader className="pb-1">
            <p className="font-semibold text-navy-700 dark:text-white">Session clients</p>
          </CardHeader>
          <CardBody className="flex flex-col gap-6 pt-2">
            {distribution ? (
              <>
                <DistributionList title="Browser" items={distribution.browsers} />
                <DistributionList title="OS" items={distribution.oss} />
                <DistributionList title="Device type" items={distribution.devices} />
              </>
            ) : (
              <p className="text-sm text-gray-400">No session data</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Recent sessions */}
      <Card className="border border-gray-200/30 dark:border-white/5 dark:bg-navy-800">
        <CardHeader>
          <p className="font-semibold text-navy-700 dark:text-white">Recent sessions</p>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200/30 dark:border-white/5">
                  {['User', 'Browser / OS', 'IP address', 'Last active', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.recent.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                      No sessions yet
                    </td>
                  </tr>
                ) : (
                  sessions.recent.map((s) => {
                    const parsed = s.userAgent ? new UAParser(s.userAgent) : null;
                    const isActive = new Date(s.expiresAt) > new Date();
                    const name =
                      [s.user.firstName, s.user.lastName].filter(Boolean).join(' ') ||
                      s.user.email ||
                      'Unknown';

                    return (
                      <tr
                        key={s.id}
                        className="border-b border-gray-200/20 last:border-0 hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/2"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar
                              {...(s.user.avatarUrl ? { src: s.user.avatarUrl } : {})}
                              name={name}
                              size="sm"
                              className="shrink-0"
                            />
                            <div>
                              <p className="text-sm font-medium text-navy-700 dark:text-white">
                                {name}
                              </p>
                              <p className="text-xs text-gray-400">{s.user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {parsed ? (
                            <div>
                              <p className="text-sm text-navy-700 dark:text-white">
                                {parsed.getBrowser().name ?? '—'}{' '}
                                <span className="text-xs text-gray-400">
                                  {parsed.getBrowser().version?.split('.')[0]}
                                </span>
                              </p>
                              <p className="text-xs text-gray-400">
                                {parsed.getOS().name} {parsed.getOS().version}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-gray-600 dark:text-gray-300">
                          {s.ipAddress ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {relativeTime(s.lastActiveAt)}
                        </td>
                        <td className="px-4 py-3">
                          <Chip size="sm" variant="flat" color={isActive ? 'success' : 'default'}>
                            {isActive ? 'Active' : 'Expired'}
                          </Chip>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Invite summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border border-gray-200/30 dark:border-white/5 dark:bg-navy-800">
          <CardBody className="p-5 text-center">
            <p className="text-3xl font-bold text-navy-700 dark:text-white">{invites.total}</p>
            <p className="mt-1 text-sm text-gray-500">Total invites</p>
          </CardBody>
        </Card>
        <Card className="border border-gray-200/30 dark:border-white/5 dark:bg-navy-800">
          <CardBody className="p-5 text-center">
            <p className="text-3xl font-bold text-green-500">{invites.accepted}</p>
            <p className="mt-1 text-sm text-gray-500">Accepted</p>
          </CardBody>
        </Card>
        <Card className="border border-gray-200/30 dark:border-white/5 dark:bg-navy-800">
          <CardBody className="p-5 text-center">
            <p className="text-3xl font-bold text-red-400">{invites.expired}</p>
            <p className="mt-1 text-sm text-gray-500">Expired</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
