-- 重新组织submissions表结构
-- 按照要求的字段顺序：学号、姓名、第几天、具体作业、必做/选做、作业详细要求、学员提交的作业、AI的作业评估、毕业合格统计

-- 1. 备份现有数据
CREATE TABLE submissions_backup AS SELECT * FROM submissions;

-- 2. 删除现有的submissions表
DROP TABLE IF EXISTS submissions CASCADE;

-- 3. 创建新的submissions表，按照要求的字段顺序
CREATE TABLE submissions (
  -- 按照要求的显示顺序
  学号 TEXT NOT NULL,                    -- student_id (重命名为中文)
  姓名 TEXT,                            -- student_name (新增冗余字段)
  第几天 TEXT,                          -- day_text (新增冗余字段)
  具体作业 TEXT,                        -- assignment_title (新增冗余字段)
  必做选做 TEXT,                        -- is_mandatory转换后的文本 (新增冗余字段)
  作业详细要求 TEXT,                    -- description (新增冗余字段)
  学员提交的作业 JSONB,                 -- attachments_url (重命名为中文)
  AI的作业评估 TEXT,                    -- feedback (重命名为中文)
  毕业合格统计 TEXT DEFAULT '批改中',   -- status (重命名为中文)
  
  -- 重要的系统字段放在最后
  submission_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES assignments(assignment_id),
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建索引
CREATE INDEX idx_submissions_学号 ON submissions(学号);
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_毕业合格统计 ON submissions(毕业合格统计);
CREATE INDEX idx_submissions_第几天 ON submissions(第几天);

-- 5. 从备份表恢复数据，并填充新的冗余字段
INSERT INTO submissions (
  学号, 姓名, 第几天, 具体作业, 必做选做, 作业详细要求, 
  学员提交的作业, AI的作业评估, 毕业合格统计,
  submission_id, assignment_id, submission_date, created_at
)
SELECT 
  sb.student_id as 学号,
  sb.student_id as 姓名,  -- 暂时使用学号作为姓名，后续可以手动更新
  COALESCE(a.day_number, '未知时间') as 第几天,
  COALESCE(a.assignment_title, '未知作业') as 具体作业,
  CASE WHEN a.is_mandatory THEN '必做' ELSE '选做' END as 必做选做,
  COALESCE(a.description, '无详细要求') as 作业详细要求,
  sb.attachments_url as 学员提交的作业,
  sb.feedback as AI的作业评估,
  sb.status as 毕业合格统计,
  sb.submission_id,
  sb.assignment_id,
  sb.submission_date,
  sb.created_at
FROM submissions_backup sb
LEFT JOIN assignments a ON sb.assignment_id = a.assignment_id;

-- 6. 创建触发器函数，用于在插入/更新时自动填充冗余字段
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
  
  -- 暂时使用学号作为姓名，如果有students表可以后续修改
  IF NEW.姓名 IS NULL OR NEW.姓名 = '' THEN
    NEW.姓名 := NEW.学号;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. 创建触发器
CREATE TRIGGER trigger_update_submission_fields
  BEFORE INSERT OR UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_submission_redundant_fields();

-- 8. 删除备份表（可选，建议先测试后再删除）
-- DROP TABLE submissions_backup;

-- 9. 验证新表结构
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'submissions' 
ORDER BY ordinal_position;

-- 10. 显示前几条数据验证
SELECT * FROM submissions LIMIT 5;