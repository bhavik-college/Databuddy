import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
  images: {
    domains: ['qdpxznrqyzyebbrmqvpi.supabase.co', 'localhost'],
  },
};

export default nextConfig;
