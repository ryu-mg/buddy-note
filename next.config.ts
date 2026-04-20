import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@resvg/resvg-js', 'sharp'],
  images: {
    // Supabase Storage:
    // - photos bucket: private, signed URL (query string token) — `/storage/v1/object/sign/**`
    // - diary-images bucket: public — `/storage/v1/object/public/**`
    // 한 host 패턴으로 둘 다 커버. production에서는 hostname을 구체 project ref로 좁히는 걸 권장.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
}

export default nextConfig
