-- ========================================
-- Supabase submissions表重建脚本 - 谨慎方案
-- 目标：重新排序字段，业务字段在前，系统字段在后
-- 执行方式：分步骤，可回滚，零数据丢失
-- ========================================

-- Phase 1: 安全备份现有数据
-- ========================================

BEGIN;

-- 1.1 创建备份表，保存完整的原始数据
DROP TABLE IF EXISTS submissions_backup_v1;
CREATE TABLE submissions_backup_v1 AS 
SELECT * FROM submissions;

-- 1.2 验证备份表数据完整性
DO $$
DECLARE
    original_count INTEGER;
    backup_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO original_count FROM submissions;
    SELECT COUNT(*) INTO backup_count FROM submissions_backup_v1;
    
    IF original_count != backup_count THEN
        RAISE EXCEPTION '❌ 备份失败: 原表 % 条记录，备份表 % 条记录', original_count, backup_count;
    ELSE
        RAISE NOTICE '✅ 备份成功: % 条记录已安全备份', backup_count;
    END IF;
END $$;

COMMIT;

-- Phase 2: 创建新表结构（按用户要求的字段顺序）
-- ========================================

BEGIN;

-- 2.1 创建新的submissions表，字段按显示顺序排列
DROP TABLE IF EXISTS submissions_new;
CREATE TABLE submissions_new (
    -- ========== 业务字段（按显示顺序） ==========
    student_id TEXT NOT NULL,              -- 学号 (第1列)
    student_name TEXT,                      -- 姓名 (第2列)  
    day_text TEXT,                          -- 第几天 (第3列)
    assignment_title TEXT,                  -- 具体作业 (第4列)
    is_mandatory BOOLEAN DEFAULT false,     -- 必做/选做 (第5列)
    description TEXT,                       -- 作业详细要求 (第6列)
    attachments_url JSONB DEFAULT '[]'::jsonb, -- 学员提交的作业 (第7列)
    status TEXT DEFAULT '批改中',           -- AI的作业评估 (第8列)
    feedback TEXT,                          -- 评估详细内容 (第9列)
    graduation_status TEXT,                 -- 毕业合格统计 (第10列)
    
    -- ========== 系统字段（放在最后） ==========
    submission_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id UUID,
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.2 创建必要的索引
CREATE INDEX idx_submissions_new_student_id ON submissions_new(student_id);
CREATE INDEX idx_submissions_new_assignment_id ON submissions_new(assignment_id);
CREATE INDEX idx_submissions_new_status ON submissions_new(status);
CREATE INDEX idx_submissions_new_submission_date ON submissions_new(submission_date);

COMMIT;

-- Phase 3: 数据迁移和验证
-- ========================================

BEGIN;

-- 3.1 从原表和相关表迁移数据到新表
INSERT INTO submissions_new (
    student_id,
    student_name,
    day_text,
    assignment_title,
    is_mandatory,
    description,
    attachments_url,
    status,
    feedback,
    graduation_status,
    submission_id,
    assignment_id,
    submission_date,
    created_at,
    updated_at
)
SELECT 
    s.student_id,
    COALESCE(st.student_name, '未知学员') as student_name,  -- 从students表获取真实姓名
    CASE 
        WHEN a.day_number IS NOT NULL THEN '第' || a.day_number || '天'
        ELSE '未知天数'
    END as day_text,                        -- 从day_number生成day_text
    COALESCE(a.assignment_title, '未知作业') as assignment_title,
    COALESCE(a.is_mandatory, false) as is_mandatory,
    COALESCE(a.description, '无描述') as description,
    COALESCE(array_to_json(s.attachments_url)::jsonb, '[]'::jsonb) as attachments_url,
    COALESCE(s.status, '批改中') as status,
    s.feedback,
    CASE 
        WHEN s.status = '合格' THEN '合格'
        WHEN s.status = '不合格' THEN '不合格 - 需要改进'
        WHEN s.status = '批改中' THEN '待评估'
        ELSE '未知状态'
    END as graduation_status,
    s.submission_id,
    s.assignment_id,
    COALESCE(s.submission_date, NOW()) as submission_date,
    COALESCE(s.created_at, NOW()) as created_at,
    COALESCE(s.created_at, NOW()) as updated_at  -- 原表没有updated_at字段，使用created_at
FROM submissions s
LEFT JOIN students st ON s.student_id = st.student_id
LEFT JOIN assignments a ON s.assignment_id = a.assignment_id;

-- 3.2 验证数据迁移完整性
DO $$
DECLARE
    original_count INTEGER;
    new_count INTEGER;
    missing_names INTEGER;
BEGIN
    -- 检查记录数量
    SELECT COUNT(*) INTO original_count FROM submissions;
    SELECT COUNT(*) INTO new_count FROM submissions_new;
    
    -- 检查姓名字段完整性
    SELECT COUNT(*) INTO missing_names FROM submissions_new WHERE student_name IS NULL;
    
    IF original_count != new_count THEN
        RAISE EXCEPTION '❌ 迁移失败: 原表 % 条记录，新表 % 条记录', original_count, new_count;
    ELSIF missing_names > 0 THEN
        RAISE NOTICE '⚠️  警告: % 条记录缺少学员姓名', missing_names;
    ELSE
        RAISE NOTICE '✅ 数据迁移成功: % 条记录已迁移', new_count;
    END IF;
END $$;

COMMIT;

-- Phase 4: 准备表切换（暂不执行，等代码更新完成后手动执行）
-- ========================================

-- 以下操作需要在代码更新完成后执行：
-- 
-- 4.1 重命名表（原子操作）
-- ALTER TABLE submissions RENAME TO submissions_old;
-- ALTER TABLE submissions_new RENAME TO submissions;
-- 
-- 4.2 验证新表功能正常后清理
-- DROP TABLE submissions_old;
-- DROP TABLE submissions_backup_v1;

-- ========================================
-- 验证查询 - 检查新表结构和数据
-- ========================================

-- 显示新表结构（字段顺序）
SELECT 
    column_name,
    ordinal_position,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'submissions_new' 
ORDER BY ordinal_position;

-- 显示前5条数据验证
SELECT 
    student_id,
    student_name,
    day_text,
    assignment_title,
    is_mandatory,
    LEFT(description, 50) as description_preview,
    jsonb_array_length(attachments_url) as attachment_count,
    status,
    graduation_status
FROM submissions_new 
ORDER BY created_at DESC 
LIMIT 5;

-- 统计信息
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT student_id) as unique_students,
    COUNT(CASE WHEN status = '合格' THEN 1 END) as qualified_count,
    COUNT(CASE WHEN status = '不合格' THEN 1 END) as unqualified_count,
    COUNT(CASE WHEN status = '批改中' THEN 1 END) as pending_count
FROM submissions_new;

-- ========================================
-- 执行说明
-- ========================================

/*
执行步骤：

1. 先执行Phase 1-3（已经完成数据迁移）
2. 更新应用程序代码以适配新表结构
3. 测试所有功能正常
4. 执行Phase 4的表切换操作
5. 验证生产环境功能
6. 清理备份表

回滚方案：
如需回滚，执行：
DROP TABLE submissions_new;
-- 应用程序代码无需修改，继续使用原表

完全回滚：
DROP TABLE submissions_new;
-- 恢复到git标签: v1.1-pre-db-restructure
*/