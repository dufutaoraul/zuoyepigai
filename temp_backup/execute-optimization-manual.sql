-- ============================================
-- Supabase数据库优化脚本 - 手动执行版本
-- 执行日期: 2025-07-31
-- 说明: 请在Supabase SQL编辑器中依次执行以下SQL语句
-- ============================================

-- 步骤1: 为assignments表添加排序字段
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- 步骤2: 设置sort_order值（基于day_number的逻辑排序）
UPDATE assignments SET sort_order = 
  CASE 
    WHEN day_number = '第一周第一天' THEN 101
    WHEN day_number = '第一周第二天上午' THEN 201
    WHEN day_number = '第一周第二天下午' THEN 202
    WHEN day_number = '第一周第三天' THEN 301
    WHEN day_number = '第一周第四天' THEN 401
    WHEN day_number = '第一周第五天上午' THEN 501
    WHEN day_number = '第一周第五天下午' THEN 502
    WHEN day_number = '第一周第六天' THEN 601
    WHEN day_number = '第一周第七天上午' THEN 701
    WHEN day_number = '第一周第七天下午' THEN 702
    WHEN day_number = '第二周第一天上午' THEN 801
    WHEN day_number = '第二周第一天下午' THEN 802
    WHEN day_number = '第二周第二天' THEN 901
    WHEN day_number = '第二周第三天' THEN 1001
    WHEN day_number = '第二周第四天' THEN 1101
    WHEN day_number = '第二周第五天' THEN 1201
    WHEN day_number = '第二周第六天' THEN 1301
    ELSE 9999
  END
WHERE sort_order IS NULL;

-- 步骤3: 合并附件字段数据（将attachments_urls的数据迁移到attachments_url）
UPDATE submissions 
SET attachments_url = attachments_urls 
WHERE (attachments_url IS NULL OR attachments_url = '[]'::jsonb) 
  AND attachments_urls IS NOT NULL 
  AND attachments_urls != '[]'::jsonb;

-- 步骤4: 删除无用字段
ALTER TABLE submissions DROP COLUMN IF EXISTS assignment_evaluation_detail;
ALTER TABLE submissions DROP COLUMN IF EXISTS assignment_comprehensive_statistics;
ALTER TABLE submissions DROP COLUMN IF EXISTS attachments_urls;

-- 步骤5: 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_assignments_sort_order ON assignments(sort_order);
CREATE INDEX IF NOT EXISTS idx_submissions_submission_date_desc ON submissions(submission_date DESC);

-- 步骤6: 创建管理后台优化视图（按时间倒序显示所有提交信息）
CREATE OR REPLACE VIEW admin_submissions_view AS
SELECT 
  s.submission_id,
  s.submission_date,
  s.status,
  s.feedback,
  s.attachments_url,
  st.student_id,
  st.student_name,
  a.assignment_id,
  a.day_number,
  a.assignment_title,
  a.is_mandatory,
  a.description as assignment_description,
  a.sort_order,
  s.created_at,
  s.updated_at
FROM submissions s
LEFT JOIN students st ON s.student_id = st.student_id
LEFT JOIN assignments a ON s.assignment_id = a.assignment_id
ORDER BY s.submission_date DESC;

-- 步骤7: 创建按作业排序的视图（便于查看作业完成情况）
CREATE OR REPLACE VIEW assignments_progress_view AS
SELECT 
  a.assignment_id,
  a.day_number,
  a.assignment_title,
  a.is_mandatory,
  a.description,
  a.sort_order,
  COUNT(s.submission_id) as total_submissions,
  COUNT(CASE WHEN s.status = '合格' THEN 1 END) as passed_submissions,
  COUNT(CASE WHEN s.status = '不合格' THEN 1 END) as failed_submissions,
  COUNT(CASE WHEN s.status = '批改中' THEN 1 END) as pending_submissions,
  ROUND(
    COUNT(CASE WHEN s.status = '合格' THEN 1 END) * 100.0 / NULLIF(COUNT(s.submission_id), 0), 
    2
  ) as pass_rate
FROM assignments a
LEFT JOIN submissions s ON a.assignment_id = s.assignment_id
GROUP BY a.assignment_id, a.day_number, a.assignment_title, a.is_mandatory, a.description, a.sort_order
ORDER BY a.sort_order;

-- 步骤8: 创建学员进度视图
CREATE OR REPLACE VIEW student_progress_view AS
SELECT 
  st.student_id,
  st.student_name,
  COUNT(s.submission_id) as total_submissions,
  COUNT(CASE WHEN s.status = '合格' THEN 1 END) as passed_submissions,
  COUNT(CASE WHEN s.status = '不合格' THEN 1 END) as failed_submissions,
  COUNT(CASE WHEN s.status = '批改中' THEN 1 END) as pending_submissions,
  ROUND(
    COUNT(CASE WHEN s.status = '合格' THEN 1 END) * 100.0 / NULLIF(COUNT(s.submission_id), 0), 
    2
  ) as pass_rate,
  MAX(s.submission_date) as last_submission_date
FROM students st
LEFT JOIN submissions s ON st.student_id = s.student_id
GROUP BY st.student_id, st.student_name
ORDER BY last_submission_date DESC NULLS LAST;

-- ============================================
-- 验证优化结果（可选执行）
-- ============================================

-- 查看优化后的表结构
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'submissions';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'assignments';

-- 测试视图查询
-- SELECT * FROM admin_submissions_view LIMIT 5;
-- SELECT * FROM assignments_progress_view LIMIT 5;  
-- SELECT * FROM student_progress_view LIMIT 5;

-- ============================================
-- 执行完成提示
-- ============================================
SELECT 'Database optimization completed successfully!' as message;