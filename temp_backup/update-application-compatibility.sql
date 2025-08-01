-- 应用兼容性更新脚本
-- 为了确保现有代码正常工作，创建视图和函数来映射新旧字段名

-- 1. 创建兼容性视图，使用原来的英文字段名
CREATE OR REPLACE VIEW submissions_legacy AS
SELECT 
  学号 as student_id,
  姓名 as student_name,
  第几天 as day_text,
  具体作业 as assignment_title,
  必做选做 as is_mandatory_text,
  作业详细要求 as description,
  学员提交的作业 as attachments_url,
  AI的作业评估 as feedback,
  毕业合格统计 as status,
  submission_id,
  assignment_id,
  submission_date,
  created_at,
  -- 为了兼容原来的is_mandatory布尔字段
  CASE WHEN 必做选做 = '必做' THEN true ELSE false END as is_mandatory
FROM submissions;

-- 2. 创建插入函数，支持原来的字段名插入
CREATE OR REPLACE FUNCTION insert_submission_legacy(
  p_student_id TEXT,
  p_assignment_id UUID,
  p_attachments_url TEXT[] DEFAULT '{}',
  p_status TEXT DEFAULT '批改中',
  p_feedback TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_submission_id UUID;
BEGIN
  INSERT INTO submissions (学号, assignment_id, 学员提交的作业, 毕业合格统计, AI的作业评估)
  VALUES (p_student_id, p_assignment_id, p_attachments_url, p_status, p_feedback)
  RETURNING submission_id INTO new_submission_id;
  
  RETURN new_submission_id;
END;
$$ LANGUAGE plpgsql;

-- 3. 创建更新函数，支持原来的字段名更新
CREATE OR REPLACE FUNCTION update_submission_legacy(
  p_submission_id UUID,
  p_attachments_url TEXT[] DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_feedback TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE submissions 
  SET 
    学员提交的作业 = COALESCE(p_attachments_url, 学员提交的作业),
    毕业合格统计 = COALESCE(p_status, 毕业合格统计),
    AI的作业评估 = COALESCE(p_feedback, AI的作业评估)
  WHERE submission_id = p_submission_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 4. 验证兼容性视图
SELECT 
  student_id,
  student_name,
  day_text,
  assignment_title,
  is_mandatory,
  is_mandatory_text,
  status,
  feedback
FROM submissions_legacy 
LIMIT 3;