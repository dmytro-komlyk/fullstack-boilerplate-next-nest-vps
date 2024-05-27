/** @type {import('next').NextConfig} */
/* eslint @typescript-eslint/no-var-requires: "off" */
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

module.exports = nextConfig;
