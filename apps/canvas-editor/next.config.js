/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用 App Router
  experimental: {
    scrollRestoration: true,
  },
  
  // 压缩静态资源
  compress: true,
  
  // 配置图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // 配置缓存策略
  headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ]
  },
  
  // 禁用 x-powered-by 响应头
  poweredByHeader: false,
  
  // webpack 配置优化
  webpack: (config, { isServer }) => {
    // 禁用所有与 canvas 相关的模块，因为它们无法在 Node.js 环境中运行
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
      }
    }
    
    return config
  },
}

module.exports = nextConfig
