import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateOptimizationPlan() {
  console.log('=== 数据库优化方案 ===\n');
  
  // 基于之前的分析，生成优化建议
  console.log('## 1. 问题分析总结');
  console.log('根据数据库分析结果，发现以下问题：');
  console.log('');
  console.log('### submissions表问题：');
  console.log('- 有两个重复的附件字段：attachments_urls 和 attachments_url');
  console.log('- assignment_evaluation_detail 字段100%为空，可能不需要');
  console.log('- assignment_comprehensive_statistics 字段100%为空，可能不需要');
  console.log('- feedback字段有46.7%的记录为空（正常现象，批改中的记录暂无反馈）');
  console.log('');
  console.log('### assignments表问题：');
  console.log('- day_number字段使用字符串格式（如"第一周第一天"），不利于排序和查询');
  console.log('- 没有数字格式的排序字段');
  console.log('');
  console.log('### 管理后台查看体验问题：');
  console.log('- 需要联表查询才能看到完整的提交信息');
  console.log('- 默认排序不是按时间倒序');
  console.log('- 字段过多且有冗余');
  console.log('\n');
  
  console.log('## 2. 优化方案');
  console.log('');
  console.log('### 2.1 删除无用字段');
  console.log('建议删除以下完全没有使用的字段：');
  console.log('- submissions.assignment_evaluation_detail（100%为空）');
  console.log('- submissions.assignment_comprehensive_statistics（100%为空）');
  console.log('');
  
  console.log('### 2.2 合并重复字段');
  console.log('建议处理重复的附件字段：');
  console.log('- 统一使用 attachments_url 字段（使用率66.7%）');
  console.log('- 将 attachments_urls 的数据迁移到 attachments_url');
  console.log('- 删除 attachments_urls 字段');
  console.log('');
  
  console.log('### 2.3 优化assignments表');
  console.log('建议添加数字排序字段：');
  console.log('- 添加 sort_order INTEGER 字段用于排序');
  console.log('- 保留 day_number 字段用于显示');
  console.log('- 创建从 day_number 到 sort_order 的映射');
  console.log('');
  
  console.log('### 2.4 创建优化视图');
  console.log('建议创建一个包含所有必要信息的视图：');
  console.log('- 自动联表查询students、assignments和submissions');
  console.log('- 按提交时间倒序排列');
  console.log('- 只显示必要字段');
  console.log('- 便于后台管理查看');
  console.log('\n');
  
  console.log('## 3. 具体实施SQL脚本');
  console.log('');
  
  // 生成实际的SQL脚本
  const sqlScripts = `
-- 步骤1: 合并附件字段数据
UPDATE submissions 
SET attachments_url = attachments_urls 
WHERE (attachments_url IS NULL OR attachments_url = '[]'::jsonb) 
  AND attachments_urls IS NOT NULL 
  AND attachments_urls != '[]'::jsonb;

-- 步骤2: 删除无用字段
ALTER TABLE submissions DROP COLUMN IF EXISTS assignment_evaluation_detail;
ALTER TABLE submissions DROP COLUMN IF EXISTS assignment_comprehensive_statistics;
ALTER TABLE submissions DROP COLUMN IF EXISTS attachments_urls;

-- 步骤3: 为assignments表添加排序字段
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- 步骤4: 设置sort_order值（基于day_number的逻辑排序）
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
  END;

-- 步骤5: 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_assignments_sort_order ON assignments(sort_order);
CREATE INDEX IF NOT EXISTS idx_submissions_submission_date_desc ON submissions(submission_date DESC);

-- 步骤6: 创建管理后台优化视图
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
`;
  
  console.log('```sql');
  console.log(sqlScripts);
  console.log('```');
  console.log('\n');
  
  console.log('## 4. 优化后的效果');
  console.log('');
  console.log('### 4.1 字段优化效果：');
  console.log('- 删除了2个100%为空的无用字段');
  console.log('- 合并了重复的附件字段');
  console.log('- 表结构更加简洁清晰');
  console.log('');
  console.log('### 4.2 查询优化效果：');
  console.log('- admin_submissions_view：按时间倒序显示所有提交信息');
  console.log('- assignments_progress_view：显示每个作业的完成情况统计');
  console.log('- student_progress_view：显示每个学员的学习进度');
  console.log('');
  console.log('### 4.3 管理后台使用方式：');
  console.log('```sql');
  console.log('-- 查看最新提交记录');
  console.log('SELECT * FROM admin_submissions_view LIMIT 20;');
  console.log('');
  console.log('-- 查看作业完成情况');
  console.log('SELECT * FROM assignments_progress_view;');
  console.log('');
  console.log('-- 查看学员进度排名');
  console.log('SELECT * FROM student_progress_view;');
  console.log('```');
}

// 运行优化方案生成
generateOptimizationPlan();