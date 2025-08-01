# 🗄️ Supabase数据库设置指南

## 📋 当前状态
- ✅ 网站已成功部署到Netlify
- ✅ Excel学员数据已读取完成（260条记录）
- ❌ 数据库表格尚未创建

## 🚀 立即设置步骤

### 步骤1: 创建数据库表格

1. **访问Supabase控制台**
   - 打开 https://supabase.com
   - 登录您的账户
   - 选择项目 **zuoyepigai**

2. **打开SQL编辑器**
   - 点击左侧菜单的 **SQL Editor**
   - 点击 **New query**

3. **执行建表SQL**
   复制以下SQL代码并执行：

```sql
-- 创建学员名单表
CREATE TABLE IF NOT EXISTS students (
  student_id VARCHAR(20) PRIMARY KEY,
  student_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建作业清单表
CREATE TABLE IF NOT EXISTS assignments (
  assignment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_number INTEGER NOT NULL,
  assignment_title VARCHAR(200) NOT NULL,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建作业提交审核表
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

-- 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_assignments_day_number ON assignments(day_number);
CREATE INDEX IF NOT EXISTS idx_assignments_mandatory ON assignments(is_mandatory);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- 插入示例作业数据
INSERT INTO assignments (day_number, assignment_title, is_mandatory, description) VALUES
(1, 'HTML基础页面制作', true, '创建一个包含标题、段落、列表和链接的基础HTML页面。要求：1. 使用语义化标签；2. 包含meta标签；3. 结构清晰合理。'),
(1, 'CSS样式练习', false, '为HTML页面添加基础样式。要求：1. 使用外部CSS文件；2. 设置字体、颜色、间距；3. 实现简单的布局。'),
(2, 'JavaScript基础语法', true, '编写JavaScript代码实现基础功能。要求：1. 变量声明和数据类型；2. 条件判断和循环；3. 函数定义和调用。'),
(2, '网页交互效果', false, '使用JavaScript实现网页交互。要求：1. 按钮点击事件；2. 表单验证；3. DOM操作。'),
(3, '响应式布局设计', true, '创建响应式网页布局。要求：1. 使用CSS Grid或Flexbox；2. 适配不同屏幕尺寸；3. 移动端友好。');
```

4. **点击Run执行**

### 步骤2: 创建存储桶

1. **进入Storage设置**
   - 点击左侧菜单的 **Storage**
   - 点击 **Create a new bucket**

2. **创建存储桶**
   - Bucket name: `assignments`
   - 勾选 **Public bucket**
   - 点击 **Create bucket**

### 步骤3: 导入学员数据

表格创建完成后，回到项目目录运行：

```bash
node import-students.js
```

## 📊 Excel数据预览

从Excel文件中读取到以下数据：
- **总学员数**: 260人
- **学号格式**: AXCF2025XXXXXX
- **数据示例**:
  - AXCF2025010001 → Mike
  - AXCF2025010002 → 缘起
  - AXCF2025010003 → 兔子
  - AXCF2025010004 → 小惠
  - AXCF2025010005 → 正方形

## ✅ 完成后的效果

设置完成后，您的网站将支持：
- ✅ 输入学号自动显示学员姓名
- ✅ 260个真实学员数据
- ✅ 作业提交和查询功能
- ✅ 毕业资格审核功能

## 🔧 如需帮助

如果遇到问题：
1. 确认SQL执行没有错误
2. 检查存储桶是否创建成功
3. 重新运行导入脚本
4. 查看控制台错误信息

---

**完成以上步骤后，您的平台就可以完整使用了！** 🎉