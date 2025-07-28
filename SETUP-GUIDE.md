# 🚀 项目设置指南

## 1. Supabase数据库设置

### 步骤1: 创建数据表
1. 访问 [Supabase控制台](https://supabase.com/dashboard)
2. 选择项目 **zuoyepigai**
3. 点击左侧菜单的 **SQL Editor**
4. 点击 **New query** 创建新查询
5. 复制以下SQL代码并执行：

```sql
-- 1. 学员名单表
CREATE TABLE IF NOT EXISTS students (
  student_id VARCHAR(20) PRIMARY KEY,
  student_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 作业清单表
CREATE TABLE IF NOT EXISTS assignments (
  assignment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_number INTEGER NOT NULL,
  assignment_title VARCHAR(200) NOT NULL,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 作业提交审核表
CREATE TABLE IF NOT EXISTS submissions (
  submission_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(assignment_id) ON DELETE CASCADE,
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attachments_url JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT '批改中' CHECK (status IN ('批改中', '合格', '不合格')),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_assignments_day_number ON assignments(day_number);
CREATE INDEX IF NOT EXISTS idx_assignments_mandatory ON assignments(is_mandatory);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
```

6. 点击 **Run** 执行SQL代码

### 步骤2: 创建存储桶
1. 在Supabase控制台中，点击左侧菜单的 **Storage**
2. 点击 **Create a new bucket**
3. 输入桶名称：`assignments`
4. 设置为 **Public bucket** (公开访问)
5. 点击 **Create bucket**

### 步骤3: 插入示例数据
回到项目目录，运行以下命令：
```bash
node test-connection.js
```

## 2. 本地开发环境设置

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000 查看应用

## 3. 功能测试

### 测试流程
1. **首页导航**: 确认三个主要功能模块显示正常
2. **作业提交**: 
   - 输入学号 `2024001`，应该显示 `张三`
   - 选择第1天，应该显示对应的作业列表
   - 测试文件上传功能
3. **作业查询**: 输入学号查看提交历史
4. **毕业检查**: 输入学号检查毕业资格

## 4. 部署到Netlify

### 准备工作
1. 将代码推送到GitHub仓库: https://github.com/dufutaoraul/pigaizuoye.git
2. 登录 [Netlify](https://netlify.com)

### 部署步骤
1. 在Netlify中点击 **New site from Git**
2. 选择 **GitHub** 并授权
3. 选择仓库 `dufutaoraul/pigaizuoye`
4. 配置构建设置：
   - Build command: `npm run build`
   - Publish directory: `out`
5. 添加环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://auoflshbrysbhqmnapjp.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTUyMjQsImV4cCI6MjA2OTI3MTIyNH0.RE-KpbFjeEF2IUW8BSCzSnnGnKAiBPGGl6MIV7QYea4`
   - `DOUBAO_API_KEY`: (您的豆包API密钥)
   - `DIFY_API_KEY`: (您的Dify API密钥)
   - `DIFY_WORKFLOW_URL`: (您的Dify工作流URL)
6. 点击 **Deploy site**

## 5. 故障排除

### 常见问题
- **数据库连接失败**: 检查环境变量配置
- **文件上传失败**: 确认Supabase存储桶已创建并设为公开
- **AI批改不工作**: 配置豆包API密钥
- **毕业检查异常**: 配置Dify工作流

### 调试命令
```bash
# 测试数据库连接
node test-connection.js

# 检查构建
npm run build

# 查看开发日志
npm run dev
```

## 6. 项目结构

```
src/
├── app/
│   ├── api/                 # API路由
│   ├── submit-assignment/   # 作业提交页面
│   ├── my-assignments/      # 作业查询页面
│   ├── graduation-check/    # 毕业检查页面
│   ├── layout.tsx          # 根布局
│   └── page.tsx            # 首页
├── components/             # 组件库
├── lib/                   # 工具库
└── types/                 # 类型定义
```

完成以上设置后，您的在线学习与作业管理平台就可以正常运行了！🎉