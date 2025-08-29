import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    domains: ['www.instagram.com', 'scontent.cdninstagram.com', 'scontent.xx.fbcdn.net'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.instagram.com https://www.instagram.com https://www.googletagmanager.com https://www.google-analytics.com; frame-src 'self' https://*.instagram.com https://www.instagram.com; connect-src 'self' https://*.instagram.com https://www.instagram.com https://www.google-analytics.com https://*.supabase.co; img-src 'self' data: https://*.instagram.com https://www.instagram.com https://*.cdninstagram.com https://scontent.cdninstagram.com; style-src 'self' 'unsafe-inline' https://*.instagram.com; font-src 'self' data:"
          }
        ]
      }
    ]
  }
};

export default nextConfig;
