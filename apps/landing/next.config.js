// const { withNextJSMonorepoWorkaroundPlugin } = require('@prisma/nextjs-monorepo-workaround-plugin')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@databuddy/db"],
  webpack: (config, { isServer }) => {
    return config
  },
}

module.exports = nextConfig

// module.exports = withNextJSMonorepoWorkaroundPlugin(nextConfig) 