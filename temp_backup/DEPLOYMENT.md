# 🚀 部署指南

## 项目状态
✅ **项目构建成功** - 所有页面和API已成功编译
✅ **环境配置完成** - Supabase配置已更新
✅ **依赖安装完成** - 所有必要包已安装

## 立即部署步骤

### 1. 推送代码到GitHub
```bash
git init
git add .
git commit -m "初始版本：在线学习与作业管理平台"
git remote add origin https://github.com/dufutaoraul/pigaizuoye.git
git push -u origin main
```

### 2. Netlify部署配置

#### 方法A: 通过Netlify控制台
1. 访问 [Netlify](https://app.netlify.com)
2. 点击 **New site from Git**
3. 选择 **GitHub** 并连接仓库 `dufutaoraul/pigaizuoye`
4. 配置构建设置：
   - **Build command**: `npm run build`
   - **Publish directory**: `out`
   - **Node version**: `18`

#### 方法B: 使用Netlify CLI (推荐)
```bash
# 安装Netlify CLI
npm install -g netlify-cli

# 登录Netlify
netlify login

# 初始化站点
netlify init

# 部署
netlify deploy --prod
```

### 3. 环境变量配置
在Netlify控制台的 **Site settings > Environment variables** 中添加：

```
NEXT_PUBLIC_SUPABASE_URL=https://auoflshbrysbhqmnapjp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTUyMjQsImV4cCI6MjA2OTI3MTIyNH0.RE-KpbFjeEF2IUW8BSCzSnnGnKAiBPGGl6MIV7QYea4
DOUBAO_API_KEY=your_doubao_api_key_here
DIFY_API_KEY=your_dify_api_key_here
DIFY_WORKFLOW_URL=your_dify_workflow_url_here
```

## 部署前检查清单

### ✅ 已完成项目
- [x] Next.js应用架构搭建
- [x] 三大核心页面开发
- [x] Supabase数据库集成
- [x] 文件上传功能
- [x] 响应式设计
- [x] TypeScript类型定义
- [x] API路由实现

### 🔧 需要配置的服务

#### Supabase数据库 (必需)
1. **执行SQL脚本**：
   - 登录 [Supabase控制台](https://supabase.com/dashboard)
   - 选择项目 `zuoyepigai`
   - 在SQL Editor中执行 `supabase-tables.sql` 中的代码
   
2. **创建存储桶**：
   - 在Storage中创建名为 `assignments` 的公开存储桶

3. **插入示例数据**：
   ```bash
   node test-connection.js
   ```

#### 豆包AI (可选 - 用于自动批改)
- 获取API密钥并配置 `DOUBAO_API_KEY`
- 如未配置，系统将使用模拟批改结果

#### Dify工作流 (可选 - 用于毕业审核)
- 配置 `DIFY_API_KEY` 和 `DIFY_WORKFLOW_URL`
- 如未配置，系统将直接查询数据库判断毕业资格

## 功能测试

### 本地测试
```bash
npm run dev
# 访问 http://localhost:3000
```

### 测试用例
1. **首页导航** - 确认三个功能模块链接正常
2. **作业提交** - 测试学号联动、文件上传
3. **作业查询** - 测试历史记录查看
4. **毕业检查** - 测试资格审核功能

### 示例测试数据
- 学号: `2024001` (张三)
- 学号: `2024002` (李四)
- 学号: `2024003` (王五)

## 部署后验证

### 检查项目
1. **页面加载** - 所有页面正常访问
2. **数据库连接** - 学号输入显示姓名
3. **文件上传** - 上传功能正常工作
4. **API响应** - 批改和审核功能正常

### 常见问题
- **404错误**: 检查构建配置和路由设置
- **环境变量**: 确认Netlify中环境变量配置正确
- **数据库连接**: 验证Supabase表格已创建
- **文件上传**: 确认存储桶已创建并设为公开

## 维护说明

### 日常维护
- 监控Netlify部署状态
- 检查Supabase使用量
- 更新API密钥（如过期）

### 扩展功能
- 管理员后台界面
- 批量导入学员数据
- 详细的学习分析报告
- 移动端App开发

---

🎉 **项目已准备就绪，可以立即部署！**

按照以上步骤操作，您的在线学习与作业管理平台将快速上线运行。