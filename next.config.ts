import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  /* config options here */
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()"
          }
        ]
      }
    ];
  },
  
  // Remove source maps in production
  productionBrowserSourceMaps: false,
  
  // Security enhancements
  poweredByHeader: false, // Remove X-Powered-By header
  reactStrictMode: true,
  // Disable linting during build to avoid circular structure errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable type checking during build since we run it in lint anyway
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;