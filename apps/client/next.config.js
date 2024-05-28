/** @type {import('next').NextConfig} */
const withNextIntl = require('next-intl/plugin')();
const { PrismaPlugin } = require('@prisma/nextjs-monorepo-workaround-plugin');

const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }

    return config;
  },
  reactStrictMode: true,
  output: 'standalone',
};

module.exports = withNextIntl(nextConfig);
