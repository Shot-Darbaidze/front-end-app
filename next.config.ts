import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const configDir = path.dirname(fileURLToPath(import.meta.url));

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const apiHostPattern = (() => {
  if (!apiUrl) return null;

  try {
    const parsed = new URL(apiUrl);
    return {
      protocol: parsed.protocol.replace(":", "") as "http" | "https",
      hostname: parsed.hostname,
    };
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  /* config options here */

  turbopack: {
    root: configDir,
  },

  // Security + caching headers
  async headers() {
    const securityHeaders = [
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ];

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // CDN caching for static marketing pages
        source: '/:locale(ka|en)/(for-instructors|for-autoschools|privacy-policy|terms-of-service)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // CDN caching for city-exam content pages
        source: '/:locale(ka|en)/city-exam/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=1800, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },

  // Optimize images
  images: {
    remotePatterns: [
      ...(apiHostPattern ? [apiHostPattern] : []),
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
      },
      {
        protocol: 'https',
        hostname: 'images.instruktori.ge',
      },
      {
        protocol: 'https',
        hostname: 'pub-3dfd12c5fa9d40069445cd407dfc0481.r2.dev',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Enable React strict mode for better error detection
  reactStrictMode: true,

  // Production source maps for debugging (disable in production for security)
  productionBrowserSourceMaps: false,

  // Environment variables validation
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
};

export default nextConfig;
