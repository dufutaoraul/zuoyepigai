# 🚀 Netlify部署指南

## ✅ 代码已推送到GitHub
- 仓库地址: https://github.com/dufutaoraul/pigaizuoye.git
- 所有文件已成功上传
- 准备就绪，可以部署！

## 📋 Netlify部署步骤

### 方法1: 通过Netlify控制台部署 (推荐)

#### 1. 登录Netlify
访问 [Netlify](https://app.netlify.com) 并登录您的账户

#### 2. 创建新站点
1. 点击 **"New site from Git"**
2. 选择 **"GitHub"** 作为Git提供商
3. 如果首次使用，需要授权Netlify访问您的GitHub账户

#### 3. 选择仓库
1. 在仓库列表中找到 **"dufutaoraul/pigaizuoye"**
2. 点击选择该仓库

#### 4. 配置构建设置
```
Branch to deploy: master
Base directory: (留空)
Build command: npm run build
Publish directory: out
```

#### 5. 添加环境变量
在 **"Advanced build settings"** 中添加环境变量：

```
NEXT_PUBLIC_SUPABASE_URL = https://auoflshbrysbhqmnapjp.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTUyMjQsImV4cCI6MjA2OTI3MTIyNH0.RE-KpbFjeEF2IUW8BSCzSnnGnKAiBPGGl6MIV7QYea4
```

#### 6. 开始部署
点击 **"Deploy site"** 开始部署

### 方法2: 使用Netlify CLI

```bash
# 安装Netlify CLI
npm install -g netlify-cli

# 登录Netlify
netlify login

# 在项目目录中初始化
netlify init

# 部署到生产环境
netlify deploy --prod
```

## ⚙️ 部署后配置

### 1. 设置自定义域名 (可选)
1. 在Netlify控制台中，转到 **"Domain settings"**
2. 点击 **"Add custom domain"**
3. 输入您的域名并验证

### 2. 配置额外的环境变量
如果您有豆包AI和Dify的API密钥，可以在 **"Environment variables"** 中添加：

```
DOUBAO_API_KEY = 您的豆包API密钥
DIFY_API_KEY = 您的Dify API密钥
DIFY_WORKFLOW_URL = 您的Dify工作流URL
```

### 3. 启用表单处理 (可选)
如果需要处理表单提交：
1. 转到 **"Forms"** 设置
2. 启用表单检测

## 🔧 Supabase数据库设置

### 必需步骤：
1. **登录Supabase控制台**: https://supabase.com/dashboard
2. **选择项目**: zuoyepigai
3. **创建数据表**:
   - 进入 **SQL Editor**
   - 执行项目中的 `supabase-tables.sql` 文件内容
4. **创建存储桶**:
   - 进入 **Storage**
   - 创建名为 `assignments` 的公开存储桶
5. **插入示例数据**:
   - 运行项目中的 `node test-connection.js`

## 📊 部署验证清单

### ✅ 检查项目
- [ ] 网站可以正常访问
- [ ] 首页三个功能模块显示正常
- [ ] 学号输入能够显示对应姓名 (测试: 2024001 → 张三)
- [ ] 作业列表能够正常加载
- [ ] 文件上传功能正常工作
- [ ] 作业查询功能正常
- [ ] 毕业资格检查功能正常

### 🐛 常见问题排查
1. **404错误**: 检查Next.js配置和构建设置
2. **环境变量错误**: 确认Netlify中的环境变量配置正确
3. **数据库连接失败**: 验证Supabase配置和表格创建
4. **文件上传失败**: 确认存储桶已创建并设为公开
5. **构建失败**: 检查package.json和依赖项

## 🎯 部署成功标识

当看到以下信息时，说明部署成功：
- Netlify显示 ✅ **"Published"** 状态
- 网站可以通过提供的URL正常访问
- 所有页面都能正常加载和交互

## 🔄 后续更新

每当您更新代码时：
```bash
git add .
git commit -m "更新描述"
git push origin master
```

Netlify会自动检测到更改并重新部署。

---

## 📞 需要帮助？

如果在部署过程中遇到问题：
1. 检查Netlify的部署日志
2. 确认所有环境变量配置正确
3. 验证Supabase数据库设置完成
4. 查看项目中的README.md和SETUP-GUIDE.md

**部署完成后，您的在线学习管理平台就可以正式使用了！** 🎉