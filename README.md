# 在线学习与作业管理平台

基于 Next.js 开发的在线学习与作业管理平台，支持作业提交、AI自动批改和毕业资格审核。

## 功能特性

### 学员功能
- 📝 **作业提交**: 智能化作业提交流程，支持多文件上传
- 📊 **作业查询**: 查看作业提交历史和批改结果
- 🎓 **毕业资格检查**: 实时检查毕业条件达成情况
- 🔄 **重新提交**: 不合格作业支持重新提交

### 技术特性
- 🤖 **AI智能批改**: 集成豆包大模型进行自动批改
- ⚡ **工作流自动化**: 使用Dify工作流实现毕业资格审核
- 📱 **响应式设计**: 适配各种设备屏幕
- 🚀 **高性能部署**: 支持Netlify一键部署

## 技术栈

- **前端**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **后端**: Next.js API Routes, Supabase
- **数据库**: PostgreSQL (Supabase)
- **存储**: Supabase Storage
- **AI服务**: 豆包大模型 (DouBao AI)
- **工作流**: Dify
- **部署**: Netlify

## 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd learning-platform
```

### 2. 安装依赖
```bash
npm install
```

### 3. 环境配置
复制 `.env.local` 文件并配置以下环境变量：

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# DouBao AI Configuration
DOUBAO_API_KEY=your_doubao_api_key_here

# Dify Configuration  
DIFY_API_KEY=your_dify_api_key_here
DIFY_WORKFLOW_URL=your_dify_workflow_url_here
```

### 4. 数据库设置
1. 在 Supabase 控制台中创建新项目
2. 执行 `database-setup.sql` 中的SQL语句创建表格
3. 在Storage中创建名为 `assignments` 的存储桶

### 5. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

## 数据库结构

### students (学员表)
- `student_id`: 学号 (主键)
- `student_name`: 学员姓名
- `created_at`: 创建时间
- `updated_at`: 更新时间

### assignments (作业表)
- `assignment_id`: 作业ID (主键)
- `day_number`: 学习天数
- `assignment_title`: 作业标题
- `is_mandatory`: 是否必做
- `description`: 作业描述
- `created_at`: 创建时间
- `updated_at`: 更新时间

### submissions (提交表)
- `submission_id`: 提交ID (主键)
- `student_id`: 学号 (外键)
- `assignment_id`: 作业ID (外键)
- `submission_date`: 提交时间
- `attachments_url`: 附件URL列表
- `status`: 批改状态 ('批改中', '合格', '不合格')
- `feedback`: 批改反馈
- `created_at`: 创建时间
- `updated_at`: 更新时间

## API接口

### POST /api/grade-assignment
触发AI作业批改
```json
{
  "studentId": "学号",
  "assignmentId": "作业ID", 
  "attachmentUrls": ["附件URL数组"]
}
```

### POST /api/check-graduation
检查毕业资格
```json
{
  "studentId": "学号"
}
```

## 部署指南

### Netlify部署
1. 将代码推送到Git仓库
2. 在Netlify中连接仓库
3. 配置环境变量
4. 部署应用

### 环境变量配置
在Netlify控制台的Environment Variables中配置：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DOUBAO_API_KEY`
- `DIFY_API_KEY`
- `DIFY_WORKFLOW_URL`

## 使用说明

### 学员使用流程
1. **提交作业**
   - 输入学号，系统自动显示姓名
   - 选择学习天数和对应作业
   - 上传作业附件（支持多文件）
   - 提交后进入AI批改流程

2. **查询作业**
   - 输入学号查看所有提交记录
   - 查看批改状态和反馈
   - 对不合格作业进行重新提交

3. **毕业资格检查**
   - 输入学号检查毕业条件
   - 查看必做作业完成情况
   - 获取具体的改进建议

### 管理员配置
1. **学员管理**: 在Supabase中管理学员信息
2. **作业配置**: 添加或修改作业要求
3. **批改监控**: 查看AI批改结果和系统状态

## 开发指南

### 项目结构
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API路由
│   ├── submit-assignment/ # 作业提交页面
│   ├── my-assignments/    # 作业查询页面
│   └── graduation-check/  # 毕业检查页面
├── components/            # 可复用组件
├── lib/                   # 工具库
└── types/                 # TypeScript类型定义
```

### 开发命令
```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run start    # 启动生产服务器
npm run lint     # 代码检查
```

## 故障排除

### 常见问题
1. **文件上传失败**: 检查Supabase存储桶配置和权限
2. **AI批改不工作**: 验证豆包API密钥和接口配置
3. **毕业检查异常**: 确认Dify工作流配置正确
4. **数据库连接问题**: 检查Supabase连接字符串和权限

### 日志查看
- 前端日志: 浏览器开发者工具控制台
- 后端日志: Netlify Functions日志
- 数据库日志: Supabase控制台

## 许可证

MIT License

## 贡献指南

欢迎提交Issue和Pull Request来改进项目。

## 联系方式

如有问题请联系项目维护者。