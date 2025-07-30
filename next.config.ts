import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Strict Mode helps catch bugs in development
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'osienefimadxwwldwjtw.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'fal.media',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.fal.media',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
