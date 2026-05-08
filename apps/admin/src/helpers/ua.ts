import { UAParser } from 'ua-parser-js';

type DistributionItem = { name: string; count: number };

const sortTop6 = (obj: Record<string, number>): DistributionItem[] =>
  Object.entries(obj)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

export const buildDistribution = (
  userAgents: string[]
): { browsers: DistributionItem[]; oss: DistributionItem[]; devices: DistributionItem[] } => {
  const browsers: Record<string, number> = {};
  const oss: Record<string, number> = {};
  const devices: Record<string, number> = {};

  for (const ua of userAgents) {
    const r = new UAParser(ua);
    const b = r.getBrowser().name ?? 'Other';
    const o = r.getOS().name ?? 'Other';
    const d = r.getDevice().type ?? 'Desktop';
    browsers[b] = (browsers[b] ?? 0) + 1;
    oss[o] = (oss[o] ?? 0) + 1;
    devices[d] = (devices[d] ?? 0) + 1;
  }

  return { browsers: sortTop6(browsers), oss: sortTop6(oss), devices: sortTop6(devices) };
};
