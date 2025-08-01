-- ============================================
-- 数据库简化脚本 - 删除冗余视图
-- 执行日期: 2025-07-31
-- 说明: 保留3个核心表，删除3个冗余视图
-- ============================================

-- 🎯 简化目标：
-- 保留：students, assignments, submissions (3个核心表)
-- 删除：admin_submissions_view, assignments_progress_view, student_progress_view (3个冗余视图)

-- ============================================
-- 第1步：备份视图数据（可选，仅供参考）
-- ============================================

-- 如果需要备份视图数据，可以先导出：
-- SELECT * FROM admin_submissions_view;
-- SELECT * FROM assignments_progress_view;
-- SELECT * FROM student_progress_view;

-- ============================================
-- 第2步：删除冗余视图
-- ============================================

-- 删除管理后台提交视图
DROP VIEW IF EXISTS admin_submissions_view;

-- 删除作业进度统计视图  
DROP VIEW IF EXISTS assignments_progress_view;

-- 删除学员进度统计视图
DROP VIEW IF EXISTS student_progress_view;

-- ============================================
-- 第3步：验证核心表完整性
-- ============================================

-- 检查3个核心表的数据量
SELECT 'students' as table_name, COUNT(*) as record_count FROM students
UNION ALL
SELECT 'assignments' as table_name, COUNT(*) as record_count FROM assignments
UNION ALL  
SELECT 'submissions' as table_name, COUNT(*) as record_count FROM submissions;

-- 验证表结构
SELECT 'students fields check' as check_type, column_name FROM information_schema.columns WHERE table_name = 'students' ORDER BY ordinal_position;
-- 预期字段：student_id, student_name, created_at, updated_at

SELECT 'assignments fields check' as check_type, column_name FROM information_schema.columns WHERE table_name = 'assignments' ORDER BY ordinal_position;  
-- 预期字段：assignment_id, day_number, assignment_title, is_mandatory, description, sort_order, created_at, updated_at

SELECT 'submissions fields check' as check_type, column_name FROM information_schema.columns WHERE table_name = 'submissions' ORDER BY ordinal_position;
-- 预期字段：submission_id, student_id, assignment_id, submission_date, status, feedback, attachments_url, created_at, updated_at

-- ============================================  
-- 第4步：测试核心功能查询
-- ============================================

-- 测试1：查看最新提交记录（替代admin_submissions_view）
SELECT 
  s.submission_id,
  s.submission_date,
  s.status,
  s.feedback,
  st.student_name,
  a.assignment_title,
  a.day_number
FROM submissions s
LEFT JOIN students st ON s.student_id = st.student_id
LEFT JOIN assignments a ON s.assignment_id = a.assignment_id  
ORDER BY s.submission_date DESC
LIMIT 5;

-- 测试2：作业完成统计（替代assignments_progress_view）
SELECT 
  a.assignment_title,
  a.day_number,
  a.sort_order,
  COUNT(s.submission_id) as total_submissions,
  COUNT(CASE WHEN s.status = '合格' THEN 1 END) as passed_submissions,
  COUNT(CASE WHEN s.status = '不合格' THEN 1 END) as failed_submissions,
  ROUND(
    COUNT(CASE WHEN s.status = '合格' THEN 1 END) * 100.0 / NULLIF(COUNT(s.submission_id), 0), 
    2
  ) as pass_rate
FROM assignments a
LEFT JOIN submissions s ON a.assignment_id = s.assignment_id
GROUP BY a.assignment_id, a.assignment_title, a.day_number, a.sort_order
ORDER BY a.sort_order
LIMIT 5;

-- 测试3：学员进度统计（替代student_progress_view）
SELECT 
  st.student_name,
  st.student_id,
  COUNT(s.submission_id) as total_submissions,
  COUNT(CASE WHEN s.status = '合格' THEN 1 END) as passed_submissions,
  MAX(s.submission_date) as last_submission_date
FROM students st
LEFT JOIN submissions s ON st.student_id = s.student_id
GROUP BY st.student_id, st.student_name
ORDER BY last_submission_date DESC NULLS LAST
LIMIT 5;

-- ============================================
-- 执行完成提示
-- ============================================

SELECT 'Database simplification completed successfully!' as message,
       'Kept 3 core tables: students, assignments, submissions' as core_tables,
       'Removed 3 redundant views: admin_submissions_view, assignments_progress_view, student_progress_view' as removed_views;