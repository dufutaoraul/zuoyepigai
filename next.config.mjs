/** @type {import('next').NextConfig} */
const nextConfig = {
  // Netlify 部署优化配置
  images: {
    unoptimized: true
  },
  // 确保 API Routes 在 Netlify 上正确运行
  serverExternalPackages: ['@supabase/supabase-js'],
  // 环境变量配置
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Netlify适配
  trailingSlash: false
};

export default nextConfig;