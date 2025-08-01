-- ============================================
-- submissions表结构完善脚本
-- 执行日期: 2025-07-31  
-- 说明: 添加缺失字段，完善submissions表功能
-- ============================================

-- 🎯 用户需求：
-- 在submissions表中完整显示：学号、姓名、第几天、作业名称、是否必做、
-- 作业详情、学员提交的作业内容、AI评估结果、是否能够毕业及其原因

-- ============================================
-- 第1步：添加新字段
-- ============================================

-- 学员提交的作业文字内容
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submission_content TEXT;

-- 提交类型标识
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submission_type TEXT DEFAULT '图片';

-- AI量化评分
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100);

-- 是否能够毕业 
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS can_graduate BOOLEAN;

-- 毕业判定原因
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS graduation_reason TEXT;

-- ============================================
-- 第2步：为现有数据设置默认值
-- ============================================

-- 根据附件情况设置提交类型
UPDATE submissions SET 
  submission_type = CASE 
    WHEN attachments_url IS NOT NULL AND jsonb_array_length(attachments_url) > 0 THEN '图片'
    ELSE '文字'
  END
WHERE submission_type IS NULL OR submission_type = '';

-- 根据现有status设置AI评分
UPDATE submissions SET 
  ai_score = CASE 
    WHEN status = '合格' THEN 85
    WHEN status = '不合格' THEN 45
    WHEN status = '批改中' THEN NULL
    ELSE 60
  END
WHERE ai_score IS NULL;

-- 暂时设置毕业状态（后续可根据业务逻辑调整）
UPDATE submissions SET 
  can_graduate = CASE 
    WHEN status = '合格' THEN TRUE
    WHEN status = '不合格' THEN FALSE  
    ELSE NULL
  END
WHERE can_graduate IS NULL;

-- 设置毕业原因
UPDATE submissions SET 
  graduation_reason = CASE 
    WHEN status = '合格' THEN '作业完成质量良好，符合要求'
    WHEN status = '不合格' THEN '作业不符合要求，需要重新提交'
    WHEN status = '批改中' THEN '正在评估中'
    ELSE '待评估'
  END
WHERE graduation_reason IS NULL OR graduation_reason = '';

-- ============================================
-- 第3步：创建完整的管理视图查询
-- ============================================

-- 这是完整显示所有信息的查询，可以保存为视图或直接使用
-- CREATE OR REPLACE VIEW complete_submissions_view AS
-- (取消注释上面一行来创建视图)

SELECT 
  -- 基础信息
  s.submission_id,
  s.submission_date,
  
  -- 👨‍🎓 学员信息 (通过关联获得)
  st.student_id as "学号",
  st.student_name as "姓名",
  
  -- 📚 作业信息 (通过关联获得)  
  a.day_number as "第几天",
  a.assignment_title as "作业名称",
  CASE WHEN a.is_mandatory THEN '必做' ELSE '选做' END as "是否必做",
  a.description as "作业详情",
  
  -- 📝 提交内容
  COALESCE(s.submission_content, '(学员未提供文字说明)') as "学员提交的作业内容",
  s.submission_type as "提交类型",
  CASE 
    WHEN s.attachments_url IS NOT NULL AND jsonb_array_length(s.attachments_url) > 0 
    THEN jsonb_array_length(s.attachments_url) || '个附件'
    ELSE '无附件'
  END as "附件情况",
  
  -- 🤖 AI评估结果
  s.status as "审核状态",
  s.feedback as "AI评估的作业结果",
  COALESCE(s.ai_score::text, '未评分') as "AI评分",
  
  -- 🎓 毕业判定
  CASE 
    WHEN s.can_graduate IS TRUE THEN '✅ 可以毕业'
    WHEN s.can_graduate IS FALSE THEN '❌ 不能毕业' 
    ELSE '⏳ 待评估'
  END as "是否能够毕业",
  s.graduation_reason as "毕业原因",
  
  -- 📊 其他信息
  s.created_at,
  s.updated_at
  
FROM submissions s
LEFT JOIN students st ON s.student_id = st.student_id
LEFT JOIN assignments a ON s.assignment_id = a.assignment_id
ORDER BY s.submission_date DESC;

-- ============================================
-- 第4步：验证表结构
-- ============================================

-- 查看新的表结构
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'submissions' 
ORDER BY ordinal_position;

-- 统计数据完整性
SELECT 
  COUNT(*) as total_submissions,
  COUNT(submission_content) as has_content,
  COUNT(submission_type) as has_type,
  COUNT(ai_score) as has_score,
  COUNT(can_graduate) as has_graduation_status,
  COUNT(graduation_reason) as has_graduation_reason
FROM submissions;

-- ============================================
-- 第5步：创建便捷的管理查询
-- ============================================

-- 查询1：完整的提交记录（用于管理后台）
-- SELECT * FROM complete_submissions_view LIMIT 10;

-- 查询2：需要补充内容的记录
SELECT 
  st.student_name, 
  a.assignment_title,
  s.submission_date,
  '需要补充提交内容' as issue
FROM submissions s
LEFT JOIN students st ON s.student_id = st.student_id  
LEFT JOIN assignments a ON s.assignment_id = a.assignment_id
WHERE s.submission_content IS NULL OR s.submission_content = '';

-- 查询3：毕业资格统计
SELECT 
  st.student_name,
  COUNT(*) as total_submissions,
  COUNT(CASE WHEN s.can_graduate = TRUE THEN 1 END) as qualified_submissions,
  COUNT(CASE WHEN s.can_graduate = FALSE THEN 1 END) as unqualified_submissions,
  ROUND(
    COUNT(CASE WHEN s.can_graduate = TRUE THEN 1 END) * 100.0 / COUNT(*), 
    1
  ) as qualification_rate
FROM submissions s
LEFT JOIN students st ON s.student_id = st.student_id
GROUP BY st.student_id, st.student_name
ORDER BY qualification_rate DESC;

-- ============================================
-- 执行完成提示
-- ============================================

SELECT 
  'submissions表结构完善完成!' as message,
  '新增5个字段：submission_content, submission_type, ai_score, can_graduate, graduation_reason' as added_fields,
  '现在可以完整显示：学号、姓名、第几天、作业名称、是否必做、作业详情、学员提交内容、AI评估结果、毕业判定' as capabilities;