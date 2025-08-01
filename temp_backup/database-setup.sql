-- 在线学习与作业管理平台数据库结构
-- 使用此SQL在Supabase中创建所需的表格

-- 1. 学员名单表
CREATE TABLE students (
  student_id VARCHAR(20) PRIMARY KEY,
  student_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 作业清单表
CREATE TABLE assignments (
  assignment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_number INTEGER NOT NULL,
  assignment_title VARCHAR(200) NOT NULL,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 作业提交审核表
CREATE TABLE submissions (
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

-- 创建索引以提高查询性能
CREATE INDEX idx_assignments_day_number ON assignments(day_number);
CREATE INDEX idx_assignments_mandatory ON assignments(is_mandatory);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_status ON submissions(status);

-- 创建存储桶用于文件上传
-- 这需要在Supabase控制台中手动创建
-- 存储桶名称: assignments
-- 公开访问: 是

-- 插入示例数据

-- 示例学员数据
INSERT INTO students (student_id, student_name) VALUES
('2024001', '张三'),
('2024002', '李四'),
('2024003', '王五'),
('2024004', '赵六'),
('2024005', '钱七');

-- 示例作业数据
INSERT INTO assignments (day_number, assignment_title, is_mandatory, description) VALUES
-- 第1天作业
(1, 'HTML基础页面制作', true, '创建一个包含标题、段落、列表和链接的基础HTML页面。要求：1. 使用语义化标签；2. 包含meta标签；3. 结构清晰合理。'),
(1, 'CSS样式练习', false, '为HTML页面添加基础样式。要求：1. 使用外部CSS文件；2. 设置字体、颜色、间距；3. 实现简单的布局。'),

-- 第2天作业
(2, 'JavaScript基础语法', true, '编写JavaScript代码实现基础功能。要求：1. 变量声明和数据类型；2. 条件判断和循环；3. 函数定义和调用。'),
(2, '网页交互效果', false, '使用JavaScript实现网页交互。要求：1. 按钮点击事件；2. 表单验证；3. DOM操作。'),

-- 第3天作业
(3, '响应式布局设计', true, '创建响应式网页布局。要求：1. 使用CSS Grid或Flexbox；2. 适配不同屏幕尺寸；3. 移动端友好。'),
(3, 'Bootstrap框架应用', false, '使用Bootstrap框架快速构建页面。要求：1. 引入Bootstrap；2. 使用栅格系统；3. 应用组件样式。'),

-- 第4天作业
(4, 'Vue.js基础组件', true, '创建Vue.js基础组件。要求：1. 组件化开发；2. 数据绑定；3. 事件处理。'),
(4, 'Vue Router路由配置', false, '配置Vue应用路由。要求：1. 多页面路由；2. 路由参数传递；3. 导航守卫。'),

-- 第5天作业
(5, 'API接口调用', true, '实现前后端数据交互。要求：1. 使用fetch或axios；2. 处理异步请求；3. 错误处理机制。'),
(5, '项目部署实践', false, '部署项目到线上环境。要求：1. 构建生产版本；2. 配置服务器；3. 域名绑定。');

-- 插入一些示例提交记录
INSERT INTO submissions (student_id, assignment_id, attachments_url, status, feedback) 
SELECT 
  '2024001',
  assignment_id,
  '["https://example.com/image1.jpg", "https://example.com/image2.jpg"]'::jsonb,
  CASE 
    WHEN random() > 0.7 THEN '不合格'
    WHEN random() > 0.3 THEN '合格'
    ELSE '批改中'
  END,
  CASE 
    WHEN random() > 0.5 THEN '作业完成质量良好，符合要求。'
    ELSE '部分要求未达到，需要改进。'
  END
FROM assignments
WHERE day_number <= 2 AND is_mandatory = true;