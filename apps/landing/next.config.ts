import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        viewTransition: true,
        serverComponentsExternalPackages: ['@clickhouse/client'],
    },
    images: {
        domains: ['qdpxznrqyzyebbrmqvpi.supabase.co'],
    },
    webpack: (config, { isServer }) => {
        // Handle @clickhouse/client as a server-only module
        if (!isServer) {
            config.resolve.alias['@clickhouse/client'] = 'null-loader';
        }
        return config;
    },
};

export default nextConfig;
