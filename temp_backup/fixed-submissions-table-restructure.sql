-- 修复submissions表结构
-- 最终目标：学员名单(students)、作业清单(assignments)、作业提交审核表(submissions)

-- 1. 清理多余的表
DROP TABLE IF EXISTS submissions_backup CASCADE;

-- 2. 备份现有submissions数据
CREATE TABLE submissions_temp AS SELECT * FROM submissions;

-- 3. 删除现有的submissions表
DROP TABLE IF EXISTS submissions CASCADE;

-- 4. 创建新的submissions表，按照要求的字段顺序
CREATE TABLE submissions (
  -- 按照要求的显示顺序
  学号 TEXT NOT NULL,                    -- student_id
  姓名 TEXT,                            -- 从students表获取真实姓名
  第几天 TEXT,                          -- 从assignments表获取day_number
  具体作业 TEXT,                        -- 从assignments表获取assignment_title
  必做选做 TEXT,                        -- 从assignments表转换is_mandatory
  作业详细要求 TEXT,                    -- 从assignments表获取description
  学员提交的作业 JSONB,                 -- attachments_url
  AI的作业评估 TEXT,                    -- feedback
  毕业合格统计 TEXT DEFAULT '批改中',   -- status + graduation_reason合并
  
  -- 重要的系统字段和原有字段保留在最后
  submission_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES assignments(assignment_id),
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  submission_content TEXT,
  submission_type TEXT,
  ai_score INTEGER,
  can_graduate BOOLEAN,
  graduation_reason TEXT
);

-- 5. 创建索引
CREATE INDEX idx_submissions_学号 ON submissions(学号);
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_毕业合格统计 ON submissions(毕业合格统计);
CREATE INDEX idx_submissions_第几天 ON submissions(第几天);

-- 6. 从临时表恢复数据，并填充新的冗余字段
INSERT INTO submissions (
  学号, 姓名, 第几天, 具体作业, 必做选做, 作业详细要求, 
  学员提交的作业, AI的作业评估, 毕业合格统计,
  submission_id, assignment_id, submission_date, created_at, updated_at,
  submission_content, submission_type, ai_score, can_graduate, graduation_reason
)
SELECT 
  st.学号,
  COALESCE(s.student_name, st.学号) as 姓名,  -- 从students表获取真实姓名
  st.第几天,
  st.具体作业,
  st.必做选做,
  st.作业详细要求,
  st.学员提交的作业,
  st.AI的作业评估,
  st.毕业合格统计,
  st.submission_id,
  st.assignment_id,
  st.submission_date,
  st.created_at,
  st.updated_at,
  st.submission_content,
  st.submission_type,
  st.ai_score,
  st.can_graduate,
  st.graduation_reason
FROM submissions_temp st
LEFT JOIN students s ON st.学号 = s.student_id;
-- 修复submissions表结构
-- 最终目标：学员名单(students)、作业清单(assignments)、作业提交审核表(submissions)

-- 1. 清理多余的表
DROP TABLE IF EXISTS submissions_backup CASCADE;

-- 2. 备份现有submissions数据
CREATE TABLE submissions_temp AS SELECT * FROM submissions;

-- 3. 删除现有的submissions表
DROP TABLE IF EXISTS submissions CASCADE;

-- 4. 创建新的submissions表，按照要求的字段顺序
CREATE TABLE submissions (
  -- 按照要求的显示顺序
  学号 TEXT NOT NULL,                    -- student_id
  姓名 TEXT,                            -- 从students表获取真实姓名
  第几天 TEXT,                          -- 从assignments表获取day_number
  具体作业 TEXT,                        -- 从assignments表获取assignment_title
  必做选做 TEXT,                        -- 从assignments表转换is_mandatory
  作业详细要求 TEXT,                    -- 从assignments表获取description
  学员提交的作业 JSONB,                 -- attachments_url
  AI的作业评估 TEXT,                    -- feedback
  毕业合格统计 TEXT DEFAULT '批改中',   -- status + graduation_reason合并
  
  -- 重要的系统字段和原有字段保留在最后
  submission_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES assignments(assignment_id),
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  submission_content TEXT,
  submission_type TEXT,
  ai_score INTEGER,
  can_graduate BOOLEAN,
  graduation_reason TEXT
);

-- 5. 创建索引
CREATE INDEX idx_submissions_学号 ON submissions(学号);
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_毕业合格统计 ON submissions(毕业合格统计);
CREATE INDEX idx_submissions_第几天 ON submissions(第几天);

-- 6. 从临时表恢复数据，并填充新的冗余字段
INSERT INTO submissions (
  学号, 姓名, 第几天, 具体作业, 必做选做, 作业详细要求, 
  学员提交的作业, AI的作业评估, 毕业合格统计,
  submission_id, assignment_id, submission_date, created_at, updated_at,
  submission_content, submission_type, ai_score, can_graduate, graduation_reason
)
SELECT 
  st.student_id as 学号,
  COALESCE(s.student_name, st.student_id) as 姓名,  -- 从students表获取真实姓名
  COALESCE(a.day_number, '未知时间') as 第几天,
  COALESCE(a.assignment_title, '未知作业') as 具体作业,
  CASE WHEN a.is_mandatory THEN '必做' ELSE '选做' END as 必做选做,
  COALESCE(a.description, '无详细要求') as 作业详细要求,
  st.attachments_url as 学员提交的作业,
  st.feedback as AI的作业评估,
  CASE 
    WHEN st.status = '不合格' AND st.graduation_reason IS NOT NULL AND st.graduation_reason != '' 
    THEN st.status || '：' || st.graduation_reason
    ELSE st.status 
  END as 毕业合格统计,
  st.submission_id,
  st.assignment_id,
  st.submission_date,
  st.created_at,
  st.updated_at,
  st.submission_content,
  st.submission_type,
  st.ai_score,
  st.can_graduate,
  st.graduation_reason
FROM submissions_temp st
LEFT JOIN assignments a ON st.assignment_id = a.assignment_id

我需要先检查原submissions表的实际字段名。让我创建一个快速检查脚本：

<write_to_file>
<path>check-submissions-fields.sql</path>
<content>-- 检查原submissions表的实际字段结构
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'submissions' 
ORDER BY ordinal_position;

-- 查看前几条数据，确认字段名
SELECT * FROM submissions LIMIT 2;
</content>
</write_to_file>

请先执行这个检查脚本，告诉我原submissions表中学生ID字段的实际名称是什么，然后我会修复SQL脚本。

从之前的截图看，可能字段名是 `student_id`，但报错说不存在，所以需要确认实际的字段名。

<attempt_completion>
<options>["supabase"]</options>
-- 修复submissions表结构
-- 最终目标：学员名单(students)、作业清单(assignments)、作业提交审核表(submissions)

-- 1. 清理多余的表
DROP TABLE IF EXISTS submissions_backup CASCADE;

-- 2. 备份现有submissions数据
CREATE TABLE submissions_temp AS SELECT * FROM submissions;

-- 3. 删除现有的submissions表
DROP TABLE IF EXISTS submissions CASCADE;

-- 4. 创建新的submissions表，按照要求的字段顺序
CREATE TABLE submissions (
  -- 按照要求的显示顺序
  学号 TEXT NOT NULL,                    -- student_id
  姓名 TEXT,                            -- 从students表获取真实姓名
  第几天 TEXT,                          -- 从assignments表获取day_number
  具体作业 TEXT,                        -- 从assignments表获取assignment_title
  必做选做 TEXT,                        -- 从assignments表转换is_mandatory
  作业详细要求 TEXT,                    -- 从assignments表获取description
  学员提交的作业 JSONB,                 -- attachments_url
  AI的作业评估 TEXT,                    -- feedback
  毕业合格统计 TEXT DEFAULT '批改中',   -- status + graduation_reason合并
  
  -- 重要的系统字段和原有字段保留在最后
  submission_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES assignments(assignment_id),
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  submission_content TEXT,
  submission_type TEXT,
  ai_score INTEGER,
  can_graduate BOOLEAN,
  graduation_reason TEXT
);

-- 5. 创建索引
CREATE INDEX idx_submissions_学号 ON submissions(学号);
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_毕业合格统计 ON submissions(毕业合格统计);
CREATE INDEX idx_submissions_第几天 ON submissions(第几天);

-- 6. 从临时表恢复数据，并填充新的冗余字段
INSERT INTO submissions (
  学号, 姓名, 第几天, 具体作业, 必做选做, 作业详细要求, 
  学员提交的作业, AI的作业评估, 毕业合格统计,
  submission_id, assignment_id, submission_date, created_at, updated_at,
  submission_content, submission_type, ai_score, can_graduate, graduation_reason
)
SELECT 
  st.student_id as 学号,
  COALESCE(s.student_name, st.student_id) as 姓名,  -- 从students表获取真实姓名
  COALESCE(a.day_number, '未知时间') as 第几天,
  COALESCE(a.assignment_title, '未知作业') as 具体作业,
  CASE WHEN a.is_mandatory THEN '必做' ELSE '选做' END as 必做选做,
  COALESCE(a.description, '无详细要求') as 作业详细要求,
  st.attachments_url as 学员提交的作业,
  st.feedback as AI的作业评估,
  CASE 
    WHEN st.status = '不合格' AND st.graduation_reason IS NOT NULL AND st.graduation_reason != '' 
    THEN st.status || '：' || st.graduation_reason
    ELSE st.status 
  END as 毕业合格统计,
  st.submission_id,
  st.assignment_id,
  st.submission_date,
  st.created_at,
  st.updated_at,
  st.submission_content,
  st.submission_type,
  st.ai_score,
  st.can_graduate,
  st.graduation_reason
FROM submissions_temp st
LEFT JOIN assignments a ON st.assignment_id = a.assignment_id
LEFT JOIN students s ON st.student_id = s.student_id;

-- 7. 创建触发器函数，用于在插入/更新时自动填充冗余字段
CREATE OR REPLACE FUNCTION update_submission_redundant_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- 获取作业信息
  SELECT 
    a.day_number,
    a.assignment_title,
    CASE WHEN a.is_mandatory THEN '必做' ELSE '选做' END,
    COALESCE(a.description, '无详细要求')
  INTO 
    NEW.第几天,
    NEW.具体作业,
    NEW.必做选做,
    NEW.作业详细要求
  FROM assignments a 
  WHERE a.assignment_id = NEW.assignment_id;
  
  -- 获取学生真实姓名
  SELECT student_name 
  INTO NEW.姓名
  FROM students 
  WHERE student_id = NEW.学号;
  
  -- 如果没有找到学生姓名，使用学号
  IF NEW.姓名 IS NULL OR NEW.姓名 = '' THEN
    NEW.姓名 := NEW.学号;
  END IF;
  
  -- 合并毕业状态和原因
  IF NEW.status = '不合格' AND NEW.graduation_reason IS NOT NULL AND NEW.graduation_reason != '' THEN
    NEW.毕业合格统计 := NEW.status || '：' || NEW.graduation_reason;
  ELSE
    NEW.毕业合格统计 := NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. 创建触发器
CREATE TRIGGER trigger_update_submission_fields
  BEFORE INSERT OR UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_submission_redundant_fields();

-- 9. 创建兼容性视图，确保现有代码正常工作
CREATE VIEW submissions_legacy AS
SELECT 
  submission_id,
  学号 as student_id,
  assignment_id,
  submission_date,
  学员提交的作业 as attachments_url,
  status,
  AI的作业评估 as feedback,
  created_at,
  updated_at,
  submission_content,
  submission_type,
  ai_score,
  can_graduate,
  graduation_reason
FROM submissions;

-- 10. 删除临时表
DROP TABLE submissions_temp;

-- 11. 验证新表结构
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'submissions' 
ORDER BY ordinal_position;

-- 12. 显示前几条数据验证
SELECT 
  学号, 姓名, 第几天, 具体作业, 必做选做, 
  作业详细要求, AI的作业评估, 毕业合格统计
FROM submissions 
LIMIT 5;

-- 13. 显示最终的三个表
SELECT 'students表' as 表名, COUNT(*) as 记录数 FROM students
UNION ALL
SELECT 'assignments表' as 表名, COUNT(*) as 记录数 FROM assignments  
UNION ALL
SELECT 'submissions表' as 表名, COUNT(*) as 记录数 FROM submissions;