// next.config.ts
import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // إعادة توجيه جميع المسارات إلى الـ backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },

  // تحسينات الصور
  images: {
    domains: ['127.0.0.1', 'localhost'],
  },

  // زيادة حجم الـ body
  serverActions: {
    bodySizeLimit: '10mb', // زيادة الحجم المسموح به
  },
  
  // تكوين CORS للـ API
  async headers() {
    return [
      {
        source: '/:path*', // جميع المسارات
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ];
  },
};

export default nextConfig;