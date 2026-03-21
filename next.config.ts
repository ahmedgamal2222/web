// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  // تحسينات الصور
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'hadmaj-api.info1703.workers.dev' },
      { protocol: 'http', hostname: '127.0.0.1' },
    ],
    unoptimized: true,
  },

  // زيادة حجم الـ body
  serverActions: {
    bodySizeLimit: '10mb',
  },
};

export default nextConfig;