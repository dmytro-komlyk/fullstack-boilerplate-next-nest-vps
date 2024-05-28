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
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
    NEXT_PUBLIC_SERVER_API_URL: process.env.NEXT_PUBLIC_SERVER_API_URL,
    NEXT_PUBLIC_DOCKER_SERVICE_URL: process.env.NEXT_PUBLIC_DOCKER_SERVICE_URL,
    NEXT_PUBLIC_SERVER_TRPC_URL: process.env.NEXT_PUBLIC_SERVER_TRPC_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  reactStrictMode: true,
  output: 'standalone',
};

module.exports = nextConfig;
