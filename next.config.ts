import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
