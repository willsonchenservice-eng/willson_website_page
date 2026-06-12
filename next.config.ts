import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  serverExternalPackages: ['electron'],
  ...(isProd && { output: 'export' }),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
