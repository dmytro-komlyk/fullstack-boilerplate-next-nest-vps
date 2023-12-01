/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack5: true,
  webpack(config) {
    config.resolve.fallback = { fs: false };
    config.experiments = { ...config.experiments, topLevelAwait: true };
    return config;
  },
  // webpack: (config) => {
  //   config.resolve.alias.https = "https-browserify";
  //   config.resolve.alias.http = "http-browserify";

  //   config.resolve.fallback = {
  //     querystring: "querystring-es3",
  //     crypto: false,
  //     stream: false,
  //   };

  //   return config;
  // },
  env: {
    NEXT_PUBLIC_BASE_URL: `${process.env.NEXT_PUBLIC_BASE_URL}`,
    NEXT_PUBLIC_SERVER: `${process.env.NEXT_PUBLIC_SERVER}`,
    NEXT_PUBLIC_TRPC_SERVER_URL: `${process.env.NEXT_PUBLIC_TRPC_SERVER_URL}`,
  },
  output: "standalone",
  experimental: {
    appDir: true,
    serverActions: true,
  },
  typescript: { ignoreBuildErrors: true },
};

module.exports = nextConfig;
