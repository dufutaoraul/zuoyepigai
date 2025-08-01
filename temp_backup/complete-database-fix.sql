-- 完整的数据库修复方案
-- 先创建assignments表，然后重新组织submissions表

-- 1. 创建assignments表（如果不存在）
CREATE TABLE IF NOT EXISTS assignments (
  assignment_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  day_text TEXT,  -- 存储"第一周第一天"这样的格式
  assignment_title TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT FALSE,
  description TEXT,
  assignment_category TEXT DEFAULT 'Regular_Optional',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 插入一些示例作业数据（基于你的需求）
INSERT INTO assignments (day_text, assignment_title, is_mandatory, description, assignment_category) VALUES 
('第一周第一天', '三项全能作品集', true, '你的截图需要包含以下三个内容：1.网站截图 2.思维导图截图或者播客截图或者与notebook LM对话截图。3.用AI生成的图片或者视频截图', 'Mandatory'),
('第一周第一天', '遇事不决问AI', true, '用 AI 解决的问题，你的截图需要包含：你跟AI的对话截图，截图里面需要能够看清楚你的问题和AI的回答。', 'Mandatory'),
('第一周第二天', 'AI让生活更美好', true, '你的截图需要包含：与AI的对话截图，AI给你的建议', 'Mandatory'),
('第一周第二天', '综合问答练习', true, '你的截图需要包含:你跟AI的对话截图,截图里面需要能够看清楚你的问题和AI的回答。', 'Mandatory')
ON CONFLICT (assignment_id) DO NOTHING;

-- 3. 备份现有submissions数据
CREATE TABLE submissions_backup AS SELECT * FROM submissions;

-- 4. 删除现有的submissions表
DROP TABLE IF EXISTS submissions CASCADE;

-- 5. 创建新的submissions表，按照你要求的字段顺序
CREATE TABLE submissions (
  -- 按照要求的显示顺序
  学号 TEXT NOT NULL,                    -- student_id
  姓名 TEXT,                            -- 学生姓名（暂时使用学号）
  第几天 TEXT,                          -- day_text
  具体作业 TEXT,                        -- assignment_title
  必做选做 TEXT,                        -- is_mandatory转换后的文本
  作业详细要求 TEXT,                    -- description
  学员提交的作业 TEXT[],                -- attachments_url
  AI的作业评估 TEXT,                    -- feedback
  毕业合格统计 TEXT DEFAULT '批改中',   -- status
  
  -- 重要的系统字段放在最后
  submission_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES assignments(assignment_id),
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 保留原有的额外字段
  submission_content TEXT,
  submission_type TEXT,
  ai_score INTEGER,
  can_graduate BOOLEAN,
  graduation_reason TEXT,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 6. 从备份表恢复数据，并填充新的冗余字段
INSERT INTO submissions (
  学号, 姓名, 第几天, 具体作业, 必做选做, 作业详细要求, 
  学员提交的作业, AI的作业评估, 毕业合格统计,
  submission_id, assignment_id, submission_date, created_at,
  submission_content, submission_type, ai_score, can_graduate, graduation_reason, updated_at
)
SELECT 
  sb.student_id as 学号,
  sb.student_id as 姓名,  -- 暂时使用学号作为姓名
  COALESCE(a.day_text, '未知时间') as 第几天,
  COALESCE(a.assignment_title, '未知作业') as 具体作业,
  CASE WHEN a.is_mandatory THEN '必做' ELSE '选做' END as 必做选做,
  COALESCE(a.description, '无详细要求') as 作业详细要求,
  sb.attachments_url as 学员提交的作业,
  sb.feedback as AI的作业评估,
  sb.status as 毕业合格统计,
  sb.submission_id,
  sb.assignment_id,
  sb.submission_date,
  sb.created_at,
  sb.submission_content,
  sb.submission_type,
  sb.ai_score,
  sb.can_graduate,
  sb.graduation_reason,
  sb.updated_at
FROM submissions_backup sb
LEFT JOIN assignments a ON sb.assignment_id = a.assignment_id;

-- 7. 创建索引
CREATE INDEX idx_submissions_学号 ON submissions(学号);
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_毕业合格统计 ON submissions(毕业合格统计);

-- 8. 验证结果
SELECT 
  学号, 姓名, 第几天, 具体作业, 必做选做, 
  学员提交的作业, AI的作业评估, 毕业合格统计
FROM submissions 
LIMIT 3;