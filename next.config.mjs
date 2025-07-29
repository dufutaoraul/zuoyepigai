/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // 确保不使用静态导出，因为我们有API路由
  output: undefined
};

export default nextConfig;