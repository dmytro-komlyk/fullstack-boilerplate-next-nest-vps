/** @type {import('next').NextConfig} */
const withNextIntl = require("next-intl/plugin")();

const nextConfig = {
  output: "standalone",
};

module.exports = withNextIntl(nextConfig);
