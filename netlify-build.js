#!/usr/bin/env node

// Netlify自定义构建脚本，确保正确的Next.js构建
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始Next.js构建...');

try {
  // 运行Next.js构建
  execSync('npm run build', { stdio: 'inherit' });
  
  // 检查.next目录是否存在
  const nextDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(nextDir)) {
    console.log('✅ .next目录构建成功');
    
    // 列出.next目录内容
    const contents = fs.readdirSync(nextDir);
    console.log('📁 .next目录内容:', contents);
  } else {
    console.error('❌ .next目录不存在');
    process.exit(1);
  }
  
  console.log('🎉 构建完成！');
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}