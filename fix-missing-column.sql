-- 修复 submissions 表缺失的字段
-- 在Supabase SQL Editor中执行

-- 1. 检查当前 submissions 表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'submissions' 
ORDER BY ordinal_position;

-- 2. 添加缺失的字段（如果不存在）
DO $$
BEGIN
    -- 添加 attachments_url 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'attachments_url'
    ) THEN
        ALTER TABLE submissions ADD COLUMN attachments_url JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- 添加 assignment_evaluation_detail 字段（用于统计）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'assignment_evaluation_detail'
    ) THEN
        ALTER TABLE submissions ADD COLUMN assignment_evaluation_detail TEXT;
    END IF;
    
    -- 添加 assignment_comprehensive_statistics 字段（用于统计）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'assignment_comprehensive_statistics'
    ) THEN
        ALTER TABLE submissions ADD COLUMN assignment_comprehensive_statistics TEXT;
    END IF;
END $$;

-- 3. 验证修复结果
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'submissions' 
    AND column_name IN ('attachments_url', 'assignment_evaluation_detail', 'assignment_comprehensive_statistics')
ORDER BY column_name;

-- 4. 检查完整的表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'submissions' 
ORDER BY ordinal_position;