import type { NextConfig } from 'next';

// Force safer build fallbacks because native bindings can crash on certain systems.
if (!process.env.TAILWIND_DISABLE_OXIDE) {
  process.env.TAILWIND_DISABLE_OXIDE = '1';
}

if (!process.env.NEXT_DISABLE_LIGHTNINGCSS) {
  process.env.NEXT_DISABLE_LIGHTNINGCSS = '1';
}

if (!process.env.NEXT_DISABLE_WEBPACK_CACHE) {
  process.env.NEXT_DISABLE_WEBPACK_CACHE = '1';
}

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    remotePatterns: [
      {
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
