/** @type {import('next').NextConfig} */
const nextConfig = {
  // Netlify 部署配置
  output: 'standalone',
  images: {
    unoptimized: true
  },
  // 支持 API Routes 在 Netlify 上运行
  serverExternalPackages: ['@supabase/supabase-js'],
  // 环境变量配置
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
};

export default nextConfig;