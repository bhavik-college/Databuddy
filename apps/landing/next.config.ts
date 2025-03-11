import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        viewTransition: true,
    },
    images: {
        domains: ['qdpxznrqyzyebbrmqvpi.supabase.co'],
    }
};

export default nextConfig;
