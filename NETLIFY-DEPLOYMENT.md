# Netlify 部署指南

## 🚀 快速部署

### 1. 连接GitHub仓库
- 登录 [Netlify](https://netlify.com)
- 点击 "New site from Git"
- 选择 GitHub，授权访问
- 选择仓库：`dufutaoraul/pigaizuoye`

### 2. 构建设置
```
Build command: npm run build
Publish directory: out
```

### 3. 环境变量配置
在Netlify项目设置 → Environment Variables 中添加：

```
NEXT_PUBLIC_SUPABASE_URL=https://auoflshbrysbhqmnapjp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTUyMjQsImV4cCI6MjA2OTI3MTIyNH0.RE-KpbFjeEF2IUW8BSCzSnnGnKAiBPGGl6MIV7QYea4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ

DOUBAO_API_KEY=Bearer 44cccf3b-5db1-4fc4-aaf6-f35a3710bb30
DOUBAO_MODEL_ID=ep-20250524195324-l4t8t
DOUBAO_API_URL=https://ark.cn-beijing.volces.com/api/v3/chat/completions
```

### 4. 部署设置
- Branch to deploy: `master`
- Auto publishing: ✅ Enabled

## 📋 部署清单

- [x] 代码已推送到GitHub
- [x] 环境变量已配置
- [x] 敏感信息已保护（.env.local被忽略）
- [x] API Routes已修复
- [x] 豆包AI集成完成
- [x] 毕业资格审核逻辑修复

## 🔧 注意事项

1. **Next.js配置**: 项目使用Next.js 15 + App Router
2. **API Routes**: 已实现 `/api/grade-assignment` 和 `/api/check-graduation`
3. **数据库**: 使用Supabase PostgreSQL
4. **AI服务**: 集成豆包大模型进行作业批改
5. **文件存储**: 使用Supabase Storage存储作业附件

## 🚨 首次部署后检查

1. 访问网站主页，检查页面是否正常加载
2. 测试作业提交功能（AI批改）
3. 测试毕业资格检查功能
4. 检查文件上传是否正常工作
5. 查看Netlify Functions日志确认API工作正常

## 🔍 故障排除

- **构建失败**: 检查环境变量是否正确配置
- **API不工作**: 检查Netlify Functions日志
- **数据库连接失败**: 验证Supabase配置
- **AI批改失败**: 检查豆包API密钥和配置

---

🎉 **部署完成后，你的AI作业批改系统就可以正式使用了！**