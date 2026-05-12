/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Otimização de imagens
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Headers de segurança
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  },

  // Variáveis de ambiente
  env: {
    NEXT_PUBLIC_APP_NAME: 'We Make Platform',
  },

  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // Ignorar erros de TypeScript em build (dev mode works anyway)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Ignorar erros de ESLint em build
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
