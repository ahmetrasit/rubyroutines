const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
      },
    },
    {
      urlPattern: /^https:\/\/api\.stripe\.com\/.*/i,
      handler: 'NetworkOnly', // Never cache Stripe API calls
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Skip static export errors for default error pages
  skipTrailingSlashRedirect: true,
  experimental: {
    instrumentationHook: true,
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    // ESLint has a circular structure issue with current config
    // Run lint separately with: npm run lint
    ignoreDuringBuilds: true,
  },
  // Use polling for file watching (better for network access)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
  // Security Headers
  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';

    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com wss://*.supabase.co",
      "frame-src 'self' https://js.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ];

    // Only upgrade to HTTPS in production
    if (!isDev) {
      cspDirectives.push("upgrade-insecure-requests");
    }

    const headers = [
      // Content Security Policy
      {
        key: 'Content-Security-Policy',
        value: cspDirectives.join('; ')
      },
      // Prevent clickjacking
      {
        key: 'X-Frame-Options',
        value: 'DENY'
      },
      // Prevent MIME sniffing
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
      },
      // Enable XSS filter
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block'
      },
      // Referrer policy
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin'
      },
      // Permissions policy - disable unused features
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
      }
    ];

    // Only add HSTS in production
    if (!isDev) {
      headers.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload'
      });
    }

    // Add CORS headers for API routes in development
    const apiCorsHeaders = isDev ? [
      {
        key: 'Access-Control-Allow-Origin',
        value: '*'
      },
      {
        key: 'Access-Control-Allow-Methods',
        value: 'GET, POST, PUT, DELETE, OPTIONS'
      },
      {
        key: 'Access-Control-Allow-Headers',
        value: 'Content-Type, Authorization, trpc-batch-mode'
      },
      {
        key: 'Access-Control-Allow-Credentials',
        value: 'true'
      }
    ] : [];

    return [
      {
        source: '/:path*',
        headers: headers
      },
      {
        source: '/api/:path*',
        headers: [...headers, ...apiCorsHeaders]
      }
    ]
  },
}

module.exports = withPWA(nextConfig)
