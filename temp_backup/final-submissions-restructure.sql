-- 修复submissions表结构 - 最终版本
-- 目标：学员名单(students)、作业清单(assignments)、作业提交审核表(submissions)

-- 1. 清理多余的表
DROP TABLE IF EXISTS submissions_backup CASCADE;

-- 2. 备份现有submissions数据
CREATE TABLE submissions_temp AS SELECT * FROM submissions;

-- 3. 删除现有的submissions表
DROP TABLE IF EXISTS submissions CASCADE;

-- 4. 创建新的submissions表，按照要求的字段顺序
CREATE TABLE submissions (
  -- 按照要求的显示顺序
  学号 TEXT NOT NULL,                    
  姓名 TEXT,                            
  第几天 TEXT,                          
  具体作业 TEXT,                        
  必做选做 TEXT,                        
  作业详细要求 TEXT,                    
  学员提交的作业 JSONB,                 
  AI的作业评估 TEXT,                    
  毕业合格统计 TEXT DEFAULT '批改中',   
  
  -- 重要的系统字段保留在最后
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

-- 6. 从临时表恢复数据
INSERT INTO submissions (
  学号, 姓名, 第几天, 具体作业, 必做选做, 作业详细要求, 
  学员提交的作业, AI的作业评估, 毕业合格统计,
  submission_id, assignment_id, submission_date, created_at, updated_at,
  submission_content, submission_type, ai_score, can_graduate, graduation_reason
)
SELECT 
  st.student_id as 学号,
  COALESCE(s.student_name, st.student_id) as 姓名,
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

-- 7. 创建触发器函数
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. 创建触发器
CREATE TRIGGER trigger_update_submission_fields
  BEFORE INSERT OR UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_submission_redundant_fields();

-- 9. 删除临时表
DROP TABLE submissions_temp;

-- 10. 验证结果
SELECT 
  学号, 姓名, 第几天, 具体作业, 必做选做, 
  作业详细要求, AI的作业评估, 毕业合格统计
FROM submissions 
LIMIT 5;