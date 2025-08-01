-- ========================================
-- 数据库清理脚本 - 基于用户反馈
-- 目标：使用正确的备份表，清理重复表
-- ========================================

-- 根据用户反馈：
-- ✅ submissions_backup_v1 是最正确的数据 (保留)
-- ❌ submissions 原表需要删除
-- ❌ submissions_new 新表有问题，需要删除

BEGIN;

-- 1. 首先确认 submissions_backup_v1 是正确的主表
-- 重命名为最终的 submissions 表
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS submissions_new;

-- 2. 将备份表重命名为正式表
ALTER TABLE submissions_backup_v1 RENAME TO submissions;

-- 3. 重新创建必要的索引
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submission_date ON submissions(submission_date);

-- 4. 验证最终结果
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT student_id) as unique_students,
    COUNT(CASE WHEN status = '合格' THEN 1 END) as qualified_count,
    COUNT(CASE WHEN status = '不合格' THEN 1 END) as unqualified_count,
    COUNT(CASE WHEN status = '批改中' THEN 1 END) as pending_count
FROM submissions;

COMMIT;

-- 5. 显示表结构确认
SELECT 
    column_name,
    ordinal_position,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'submissions' 
ORDER BY ordinal_position;

-- 6. 显示前几条数据验证
SELECT 
    student_id,
    status,
    feedback,
    LEFT(COALESCE(attachments_url::text, 'NULL'), 50) as attachments_preview
FROM submissions 
ORDER BY submission_date DESC 
LIMIT 5;

-- ========================================
-- 执行说明
-- ========================================

/*
这个脚本将：

1. 删除有问题的 submissions 和 submissions_new 表
2. 将正确的 submissions_backup_v1 重命名为 submissions
3. 重建索引
4. 验证数据完整性

执行后：
- submissions_backup_v1 ❌ (已重命名为submissions)
- submissions ✅ (来自backup_v1的正确数据)
- submissions_new ❌ (已删除)

注意：这是基于用户确认 submissions_backup_v1 是正确数据的前提下进行的操作
*/